# OpenClaw-Cursor Bridge MCP Server

双向通信 MCP Server，连接 OpenClaw 和 Cursor。

## 功能

- ✅ OpenClaw 发送任务给 Cursor
- ✅ Cursor 执行任务并反馈结果
- ✅ OpenClaw 控制 Cursor 操作
- ✅ 任务队列管理
- ✅ HTTP API + MCP 协议

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

## 开发模式

```bash
npm run dev
```

## 生产模式

```bash
npm start
```

## 配置 Cursor

在 Cursor 设置中添加 MCP 配置：

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

## HTTP API

### 健康检查
```bash
curl http://localhost:3000/health
```

### 创建任务
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "实现功能",
      "files": ["src/index.js"],
      "callbackUrl": "http://localhost:8080/callback"
    }
  }'
```

### 查询任务
```bash
curl http://localhost:3000/tasks/task-xxx
```

### 列出所有任务
```bash
curl http://localhost:3000/tasks
```

### 控制 Cursor 打开文件
```bash
curl -X POST http://localhost:3000/cursor/open-file \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/file.js"}'
```

## MCP 工具

Cursor AI 可以使用以下工具：

1. **check_pending_tasks** - 检查待处理任务
2. **execute_task** - 执行指定任务
3. **report_result** - 报告任务结果
4. **open_file** - 打开文件
5. **run_command** - 运行 shell 命令

## 工作流程

1. OpenClaw 通过 HTTP API 创建任务
2. Cursor AI 使用 `check_pending_tasks` 检查任务
3. Cursor AI 使用 `execute_task` 执行任务
4. Cursor AI 完成后使用 `report_result` 报告结果
5. MCP Server 回调 OpenClaw 的 callbackUrl
6. OpenClaw 接收结果

## 任务类型

- **code**: 编程任务
- **review**: 代码审查
- **refactor**: 重构
- **cursor-action**: Cursor 控制操作

## 环境变量

- `PORT`: HTTP API 端口（默认 3000）
