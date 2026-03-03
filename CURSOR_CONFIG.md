# Cursor MCP 配置

将以下配置添加到 Cursor 的 MCP 设置中：

## 配置位置

macOS: `~/Library/Application Support/Cursor/User/globalStorage/mcp-config.json`

## 配置内容

```json
{
  "mcpServers": {
    "openclaw-bridge": {
      "command": "node",
      "args": [
        "/Users/boton/.openclaw/workspace/mcp-servers/openclaw-cursor-bridge/dist/index.js"
      ],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

## 配置步骤

1. 打开 Cursor
2. 按 `Cmd + ,` 打开设置
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 点击 "Edit in settings.json"
5. 添加上面的配置
6. 重启 Cursor

## 验证配置

重启 Cursor 后，在 AI 对话中输入：

```
检查 OpenClaw 任务
```

如果配置成功，AI 会调用 `check_pending_tasks` 工具。
