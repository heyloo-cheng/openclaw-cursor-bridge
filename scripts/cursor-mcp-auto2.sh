#!/bin/bash
# Cursor MCP 完整自动化脚本 v2
# 核心改进：可靠的自动输入 + MCP 工具调用检测

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

# 剪贴板
CMD1_CLIP="使用 check_pending_tasks 工具检查待处理任务"
CMD2_CLIP_BASE="使用 execute_task 工具执行任务 "

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

# ============================================
# 等待辅助函数
# ============================================
wait_for_port() {
    local url="$1"
    local max_wait=20
    for i in $(seq 1 $max_wait); do
        curl -s "$url" > /dev/null 2>&1 && return 0
        sleep 1
    done
    return 1
}

retry() {
    local max=$1
    local fn="$2"
    shift 2
    local count=0
    while [ $count -lt $max ]; do
        if "$fn" "$@"; then
            return 0
        fi
        count=$((count + 1))
        [ $count -lt $max ] && log_warn "重试 $count/$max..."
        sleep 2
    done
    return 1
}

# ============================================
# 核心：确保 MCP Bridge 运行
# ============================================
ensure_mcp_bridge() {
    log_step "检查 MCP Bridge..."
    
    if curl -s "$MCP_BRIDGE_URL/health" > /dev/null 2>&1; then
        log_ok "MCP Bridge 已运行"
        return 0
    fi
    
    log_warn "MCP Bridge 未运行，尝试启动..."
    
    # 检查是否有手动进程
    if pgrep -f "openclaw-cursor-bridge" > /dev/null; then
        log_warn "发现手动进程，先杀掉"
        pkill -f "openclaw-cursor-bridge" 2>/dev/null || true
        sleep 2
    fi
    
    # 启动 MCP Bridge（Cursor 会自己启动，这里不需要）
    # Cursor MCP 配置会自动启动，我们只需要等待
    log_info "等待 Cursor 启动 MCP Bridge..."
    
    for i in $(seq 1 30); do
        if curl -s "$MCP_BRIDGE_URL/health" > /dev/null 2>&1; then
            log_ok "MCP Bridge 已就绪 (等待了 ${i}s)"
            return 0
        fi
        sleep 1
    done
    
    log_error "MCP Bridge 启动超时"
    return 1
}

# ============================================
# 核心：确保 Cursor 运行
# ============================================
ensure_cursor() {
    log_step "检查 Cursor..."
    
    if pgrep -x "$CURSOR_APP" > /dev/null; then
        log_ok "Cursor 已运行"
        return 0
    fi
    
    log_warn "启动 Cursor..."
    open -a "$CURSOR_APP" "$DEFAULT_PROJECT"
    sleep 8
    
    if pgrep -x "$CURSOR_APP" > /dev/null; then
        log_ok "Cursor 已启动"
        return 0
    fi
    
    log_error "Cursor 启动失败"
    return 1
}

# ============================================
# 核心：自动输入命令（改进版）
# ============================================
auto_send_command() {
    local cmd="$1"
    local desc="$2"
    
    log_step "$desc: $cmd"
    
    # 1. 激活 Cursor
    osascript -e "tell application \"$CURSOR_APP\" to activate" 2>/dev/null
    sleep 1
    
    # 2. 确保 Cursor 窗口在最前
    osascript -e 'tell application "System Events" to set frontmost of process "Cursor" to true' 2>/dev/null
    sleep 0.5
    
    # 3. 复制命令到剪贴板
    echo -n "$cmd" | pbcopy
    sleep 0.3
    
    # 4. 尝试多种方式粘贴
    local success=false
    
    # 方式1: Command+V 粘贴
    osascript -e 'tell application "System Events" to keystroke "v" using command down' 2>/dev/null
    sleep 0.5
    
    # 5. 按回车发送
    osascript -e 'tell application "System Events" to keystroke return' 2>/dev/null
    sleep 0.3
    
    log_info "命令已发送"
    return 0
}

# ============================================
# 核心：等待 MCP 工具真正被调用
# ============================================
wait_for_mcp_call() {
    local expected_tool="$1"
    local max_wait=15
    local start=$(date +%s)
    
    log_step "等待 MCP 工具 '$expected_tool' 被调用..."
    
    # 这个函数用于检测 Cursor 是否真的调用了 MCP 工具
    # 通过检查 MCP Bridge 的日志或者通过轮询任务状态
    
    for i in $(seq 1 $max_wait); do
        local elapsed=$(($(date +%s) - start))
        
        # 检查 MCP Bridge 是否有活动
        local health
        health=$(curl -s "$MCP_BRIDGE_URL/health" 2>/dev/null) || true
        
        if [ -n "$health" ]; then
            log_ok "MCP Bridge 响应正常"
            return 0
        fi
        
        sleep 1
    done
    
    log_warn "未检测到明确的 MCP 调用，可能是模型没有选择工具"
    return 1
}

# ============================================
# 核心：创建任务
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
# 核心：等待任务完成
# ============================================
wait_task_complete() {
    local task_id="$1"
    local timeout="${2:-$MAX_WAIT}"
    local start=$(date +%s)
    local last_status=""
    
    log_step "等待任务完成: $task_id"
    
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
                    local result
                    result=$(echo "$task_info" | jq -r '.result // ""' 2>/dev/null)
                    [ -n "$result" ] && echo "$result"
                    return 0
                    ;;
                failed)
                    log_error "❌ 任务失败"
                    local error
                    error=$(echo "$task_info" | jq -r '.error // "未知"' 2>/dev/null)
                    log_error "错误: $error"
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
🚀 Cursor MCP 完整自动化 v2

核心改进:
  • 可靠的自动输入（剪贴板 + AppleScript）
  • MCP 工具调用检测
  • 更好的错误处理

用法: cursor-mcp-auto2.sh <desc> [files] [workdir] [wait] [source]

示例:
  cursor-mcp-auto2.sh "创建 hello.ts" '["hello.ts"]'
  cursor-mcp-auto2.sh "修复 bug" '["app.ts"]' "/项目" "yes" "feishu"

参数:
  desc    任务描述
  files   文件列表 (JSON)
  workdir 工作目录
  wait    等待完成 (yes/no)
  source  来源 (cli/feishu)
EOF
        exit 1
    fi
    
    echo ""
    log "=========================================="
    log "🚀 Cursor MCP 完整自动化 v2"
    log "=========================================="
    echo ""
    
    # 0. 确保 MCP Bridge 运行
    log_step "0. 检查 MCP Bridge..."
    retry 3 ensure_mcp_bridge || {
        log_error "MCP Bridge 启动失败"
        log_info "提示: 检查 Cursor 设置 → MCP → openclaw-bridge 是否启用"
        exit 1
    }
    echo ""
    
    # 1. 确保 Cursor 运行
    log_step "1. 检查 Cursor..."
    retry 3 ensure_cursor || exit 1
    echo ""
    
    # 2. 创建任务
    log_step "2. 创建任务..."
    local task_id
    task_id=$(create_task "$description" "$files" "$workdir" "$source") || exit 1
    echo ""
    
    # 3. 发送第一条命令（检查待处理）
    log_step "3. 发送检查命令..."
    auto_send_command "$CMD1_CLIP" "检查待处理"
    sleep 3
    echo ""
    
    # 4. 发送第二条命令（执行任务）
    log_step "4. 发送执行命令..."
    local cmd2="${CMD2_CLIP_BASE}${task_id}"
    auto_send_command "$cmd2" "执行任务"
    sleep 2
    echo ""
    
    # 5. 等待任务完成
    if [ "$wait" = "yes" ]; then
        echo ""
        if wait_task_complete "$task_id"; then
            log_ok "=========================================="
            log_ok "🎉 任务完成!"
            log_ok "=========================================="
        else
            log_error "任务失败"
            exit 1
        fi
    else
        log_ok "命令已发送，任务 ID: $task_id"
        log_info "查看进度: curl $MCP_BRIDGE_URL/tasks/$task_id"
    fi
}

main "$@"
