# OpenClaw Plugin Integration

## 🎉 New: Direct OpenClaw Integration

As of 2026-03-04, you can now control Cursor directly from OpenClaw using the new **OpenClaw Cursor Plugin**.

### 🆚 Two Ways to Use

| Method | Use Case | Location |
|--------|----------|----------|
| **MCP Bridge** (this repo) | Cursor ↔ Any HTTP client | `mcp-servers/openclaw-cursor-bridge/` |
| **OpenClaw Plugin** (new) | OpenClaw → Cursor (integrated) | `plugins/cursor-mcp/` |

### 🚀 Quick Start with OpenClaw Plugin

#### 1. Install the Plugin

The plugin is already available in your OpenClaw workspace:

```bash
~/.openclaw/workspace/plugins/cursor-mcp/
~/.openclaw/workspace/plugins/mcp-client/
```

#### 2. Use in OpenClaw

Simply use the tools in your OpenClaw conversation:

```
You: 使用 cursor_execute 实现用户登录功能

Claude: [calls cursor_execute tool]
✅ Task dispatched to Cursor. Task ID: task-xxx

Next steps:
1. Open Cursor IDE
2. In Cursor AI, type: "check_pending_tasks"
3. Execute the task
4. Cursor will report result when done
```

#### 3. Available Tools

- `cursor_execute` - Dispatch coding tasks to Cursor
- `cursor_list_tasks` - List all tasks in queue
- `cursor_get_task` - Get task details by ID
- `cursor_open_file` - Open a file in Cursor
- `cursor_health` - Check MCP Bridge status

### 📖 Documentation

For detailed usage instructions, see:

- **Plugin Documentation**: `~/.openclaw/workspace/plugins/cursor-mcp/`
  - `SUMMARY.md` - Quick overview
  - `USAGE.md` - Detailed usage guide
  - `IMPLEMENTATION_REPORT.md` - Technical details

### 🔄 Architecture

```
┌─────────────┐
│  OpenClaw   │ (cursor_execute tool)
└──────┬──────┘
       │ HTTP API
       ↓
┌─────────────┐
│ MCP Bridge  │ (this repo, localhost:3000)
│             │
│ Task Queue  │
└──────┬──────┘
       │ MCP Protocol (stdio)
       ↓
┌─────────────┐
│ Cursor IDE  │
│             │
│ MCP Tools   │
└─────────────┘
```

### 🎯 Complete Workflow

1. **OpenClaw**: User says "使用 cursor_execute 实现功能"
2. **Plugin**: Calls `cursor_execute()` tool
3. **MCP Bridge**: Task enters queue (task-xxx)
4. **Cursor AI**: "check_pending_tasks" → sees task
5. **Cursor AI**: "execute_task task-xxx" → implements code
6. **Cursor AI**: "report_result" → sends result back
7. **MCP Bridge**: Saves result + sends Feishu notification
8. **OpenClaw**: Receives notification

### 🧪 Testing

```bash
# 1. Check MCP Bridge is running
curl http://localhost:3000/health

# 2. Test the plugin
cd ~/.openclaw/workspace/plugins/mcp-client
node test-cursor-client.js

# 3. Create a test task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "Create a hello.ts file",
      "files": ["hello.ts"]
    }
  }'
```

### 💡 Benefits

- ✅ **Integrated**: Works directly in OpenClaw conversations
- ✅ **Simple**: Just use `cursor_execute` tool
- ✅ **Bidirectional**: Full task lifecycle management
- ✅ **Reliable**: Built on official MCP protocol
- ✅ **Documented**: Complete usage guides included

### 🔗 Related

- [MCP Bridge README](./README.md) - This repository
- [OpenClaw Plugin](~/.openclaw/workspace/plugins/cursor-mcp/) - Plugin code
- [MCP Client Library](~/.openclaw/workspace/plugins/mcp-client/) - HTTP client

---

**Ready to use!** Just say "使用 cursor_execute" in your OpenClaw conversation. 🚀
