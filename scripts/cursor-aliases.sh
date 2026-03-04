# Cursor MCP 快捷命令

# 添加到 ~/.zshrc 或 ~/.bashrc

# 创建 Cursor 任务
alias cursor-task='~/.openclaw/workspace/scripts/cursor-task-create.sh'

# 查看待处理任务
alias cursor-tasks='curl -s "http://localhost:3000/tasks?status=pending" | jq ".tasks[] | {id, description: .payload.description}"'

# 查看所有任务
alias cursor-all-tasks='curl -s "http://localhost:3000/tasks" | jq ".tasks[] | {id, status, description: .payload.description}"'

# 查看特定任务
cursor-task-info() {
    curl -s "http://localhost:3000/tasks/$1" | jq .
}

# 启动 MCP Bridge
alias cursor-bridge-start='cd ~/.openclaw/workspace/mcp-servers/openclaw-cursor-bridge && npm start'

# 检查 MCP Bridge 状态
alias cursor-bridge-status='curl -s http://localhost:3000/health | jq .'

# 使用示例:
# cursor-task "创建文件" '["file.ts"]'
# cursor-tasks
# cursor-task-info task-xxx
