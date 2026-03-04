#!/bin/bash
# Cursor MCP 任务创建脚本（简化版）
# 只创建任务，不自动发送命令

set -euo pipefail

MCP_BRIDGE_URL="http://localhost:3000"
DEFAULT_PROJECT="/Users/boton/.openclaw/workspace"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# 检查 MCP Bridge 是否运行
check_mcp_bridge() {
    if ! curl -s "$MCP_BRIDGE_URL/health" > /dev/null; then
        log "❌ 错误: MCP Bridge 未运行"
        log "启动命令: cd ~/.openclaw/workspace/mcp-servers/openclaw-cursor-bridge && npm start"
        exit 1
    fi
    log "✅ MCP Bridge 正在运行"
}

# 创建任务
create_task() {
    local description="$1"
    local files="$2"
    local workdir="${3:-$DEFAULT_PROJECT}"
    
    log "创建任务: $description"
    
    local response=$(curl -s -X POST "$MCP_BRIDGE_URL/tasks" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"code\",
            \"payload\": {
                \"description\": \"$description\",
                \"files\": $files
            },
            \"workdir\": \"$workdir\",
            \"feishuTarget\": \"oc_604277f1d9e8a0e8d9e8a0e8\"
        }")
    
    local task_id=$(echo "$response" | jq -r '.taskId')
    
    if [ "$task_id" = "null" ] || [ -z "$task_id" ]; then
        log "❌ 错误: 创建任务失败"
        echo "$response" | jq .
        exit 1
    fi
    
    log "✅ 任务已创建: $task_id"
    echo "$task_id"
}

# 主函数
main() {
    local description="${1:-}"
    local files="${2:-[\"test.ts\"]}"
    local workdir="${3:-$DEFAULT_PROJECT}"
    
    if [ -z "$description" ]; then
        cat <<EOF
用法: $0 <description> [files_json] [workdir]

示例:
  $0 "创建一个 hello.ts 文件" '["hello.ts"]'
  $0 "实现 Metrics 收集系统" '["plugins/metrics-collector/index.ts"]'

参数:
  description  任务描述（支持中文）
  files_json   文件列表（JSON 数组）
  workdir      工作目录（默认: $DEFAULT_PROJECT）
EOF
        exit 1
    fi
    
    log "========================================="
    log "Cursor MCP 任务创建"
    log "========================================="
    
    # 检查 MCP Bridge
    check_mcp_bridge
    
    # 创建任务
    local task_id=$(create_task "$description" "$files" "$workdir")
    
    log "========================================="
    log "✅ 任务创建成功！"
    log ""
    log "📋 任务 ID: $task_id"
    log ""
    log "🎯 下一步（在 Cursor 中执行）："
    log ""
    log "1. 打开 Cursor Agent (Cmd+Shift+L 或 Cmd+I)"
    log ""
    log "2. 输入以下命令："
    log "   使用 check_pending_tasks 检查待处理任务"
    log ""
    log "3. 看到任务后，输入："
    log "   使用 execute_task 执行任务 $task_id"
    log ""
    log "4. 点击'允许'按钮"
    log ""
    log "5. 完成！"
    log "========================================="
}

main "$@"
