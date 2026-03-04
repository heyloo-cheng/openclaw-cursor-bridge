#!/bin/bash
# Cursor MCP 完整自动化脚本 v3 (增强版)
# 核心改进：可靠的 UI 元素定位 + 自动输入

set -uo pipefail

# ============================================
# 配置
# ============================================
CURSOR_APP="Cursor"
MCP_BRIDGE_URL="http://localhost:3000"
DEFAULT_PROJECT="/Users/boton/.openclaw/workspace"
POLL_INTERVAL=2
MAX_WAIT=1200
MAX_RETRIES=3

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
log_ok() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }
log_step() { echo -e "${MAGENTA}[→]${NC} $*"; }
log_info() { echo -e "${CYAN}[ℹ]${NC} $*"; }

# ============================================
# AppleScript: 激活 Cursor 并发送命令
# ============================================
send_to_cursor() {
    local cmd="$1"
    
    # 先把命令放到剪贴板
    echo -n "$cmd" | pbcopy
    
    # 使用更可靠的 AppleScript
    osascript <<'APPLESCRIPT'
-- 激活 Cursor
tell application "Cursor" to activate
delay 0.5

-- 确保 Cursor 在最前
tell application "System Events"
    set frontmost of process "Cursor" to true
    delay 0.3
    
    -- 使用 Cmd+V 粘贴
    keystroke "v" using command down
    delay 0.3
    
    -- 发送回车
    keystroke return
end tell

return "sent"
APPLESCRIPT
    
    return 0
}

# ============================================
# AppleScript: 尝试找到 AI 对话框并输入
# ============================================
find_and_send() {
    local cmd="$1"
    
    echo -n "$cmd" | pbcopy
    
    osascript <<'APPLESCRIPT'
tell application "Cursor" to activate
delay 0.5

tell application "System Events"
    set frontmost of process "Cursor" to true
    delay 0.5
    
    -- 尝试多次确保粘贴成功
    repeat 2 times
        keystroke "v" using command down
        delay 0.2
    end repeat
    
    delay 0.3
    keystroke return
end tell

return "done"
APPLESCRIPT
}

# ============================================
# 等待 MCP Bridge
# ============================================
wait_mcp_bridge() {
    log_step "检查 MCP Bridge..."
    
    # 等待最多 30 秒
    for i in $(seq 1 30); do
        if curl -s "$MCP_BRIDGE_URL/health" > /dev/null 2>&1; then
            log_ok "MCP Bridge 已就绪"
            return 0
        fi
        sleep 1
    done
    
    log_error "MCP Bridge 未就绪"
    log_info "请确认 Cursor 设置 → MCP → openclaw-bridge 已启用"
    return 1
}

# ============================================
# 确保 Cursor 运行
# ============================================
ensure_cursor() {
    log_step "检查 Cursor..."
    
    if pgrep -x "Cursor" > /dev/null; then
        log_ok "Cursor 已在运行"
        return 0
    fi
    
    log_info "启动 Cursor..."
    open -a "Cursor" "$DEFAULT_PROJECT"
    sleep 10
    
    if pgrep -x "Cursor" > /dev/null; then
        log_ok "Cursor 已启动"
        return 0
    fi
    
    log_error "Cursor 启动失败"
    return 1
}

# ============================================
# 创建任务
# ============================================
create_task() {
    local desc="$1"
    local files="$2"
    local workdir="${3:-$DEFAULT_PROJECT}"
    local source="${4:-cli}"
    
    log_step "创建任务: $desc"
    
    local response
    response=$(curl -s -X POST "$MCP_BRIDGE_URL/tasks" \
        -H "Content-Type: application/json" \
        -H "X-Source: $source" \
        -d "{
            \"type\": \"code\",
            \"payload\": {
                \"description\": \"$desc\",
                \"files\": $files
            },
            \"workdir\": \"$workdir\",
            \"source\": \"$source\"
        }")
    
    local task_id
    task_id=$(echo "$response" | jq -r '.taskId' 2>/dev/null) || task_id=""
    
    if [ "$task_id" = "null" ] || [ -z "$task_id" ]; then
        log_error "任务创建失败: $response"
        return 1
    fi
    
    log_ok "任务创建成功: $task_id"
    echo "$task_id"
    return 0
}

# ============================================
# 等待任务完成
# ============================================
wait_task() {
    local task_id="$1"
    local timeout="${2:-$MAX_WAIT}"
    local start=$(date +%s)
    local last_status=""
    
    log_step "监控任务: $task_id"
    
    while true; do
        local elapsed=$(($(date +%s) - start))
        
        [ $elapsed -gt $timeout ] && {
            log_error "超时 (${timeout}s)"
            return 1
        }
        
        local task_info
        task_info=$(curl -s "$MCP_BRIDGE_URL/tasks/$task_id" 2>/dev/null) || {
            sleep $POLL_INTERVAL
            continue
        }
        
        local status
        status=$(echo "$task_info" | jq -r '.status' 2>/dev/null) || status="unknown"
        
        if [ "$status" != "$last_status" ]; then
            case $status in
                completed)
                    log_ok "✅ 任务完成!"
                    return 0
                    ;;
                failed)
                    log_error "❌ 任务失败"
                    return 1
                    ;;
                processing)
                    log_info "⏳ 执行中... (${elapsed}s)"
                    ;;
                pending)
                    log_info "📋 等待中... (${elapsed}s)"
                    ;;
            esac
            last_status=$status
        fi
        
        sleep $POLL_INTERVAL
    done
}

# ============================================
# 自动执行流程
# ============================================
run_automation() {
    local task_id="$1"
    
    log_step "执行自动输入..."
    
    # 命令1: 检查待处理
    log_info "发送第1条命令: 检查待处理任务"
    find_and_send "使用 check_pending_tasks 工具检查待处理任务"
    sleep 3
    
    # 命令2: 执行任务
    log_info "发送第2条命令: 执行任务 $task_id"
    find_and_send "使用 execute_task 工具执行任务 $task_id"
    sleep 2
    
    log_ok "命令已发送完成"
}

# ============================================
# 主函数
# ============================================
main() {
    local description="${1:-}"
    local files="${2:-[\"new.ts\"]}"
    local workdir="${3:-$DEFAULT_PROJECT}"
    local wait="${4:-yes}"
    local source="${5:-cli}"
    
    if [ -z "$description" ]; then
        cat <<'EOF'
🚀 Cursor MCP 完整自动化 v3

用法: cursor-mcp-v3.sh <desc> [files] [workdir] [wait] [source]

示例:
  cursor-mcp-v3.sh "创建 hello.ts" '["hello.ts"]'
  cursor-mcp-v3.sh "修复 bug" '["app.ts"]' "/项目" "yes" "feishu"
EOF
        exit 1
    fi
    
    echo ""
    log "=========================================="
    log "🚀 Cursor MCP 完整自动化 v3"
    log "=========================================="
    echo ""
    
    # 1. 确保 Cursor 运行
    ensure_cursor || exit 1
    echo ""
    
    # 2. 等待 MCP Bridge
    wait_mcp_bridge || exit 1
    echo ""
    
    # 3. 创建任务
    log_step "创建任务..."
    local task_id
    task_id=$(create_task "$description" "$files" "$workdir" "$source") || exit 1
    echo ""
    
    # 4. 自动发送命令
    run_automation "$task_id"
    echo ""
    
    # 5. 等待完成
    if [ "$wait" = "yes" ]; then
        if wait_task "$task_id"; then
            log_ok "=========================================="
            log_ok "🎉 任务完成!"
            log_ok "=========================================="
        else
            log_error "任务失败"
            exit 1
        fi
    else
        log_ok "任务已启动: $task_id"
    fi
}

main "$@"
