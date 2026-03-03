# OpenClaw-Cursor Bridge 使用指南

## 🎉 恭喜！MCP Server 已成功创建

你现在拥有一个完整的 OpenClaw ↔ Cursor 双向通信系统。

## 📋 快速开始

### 第一步：配置 Cursor

1. 打开 Cursor
2. 按 `Cmd + ,` 打开设置
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 点击 "Edit in settings.json"
5. 添加以下配置：

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

6. 保存并重启 Cursor

### 第二步：测试 HTTP API

```bash
# 健康检查
curl http://localhost:3000/health

# 应该返回：
# {
#   "status": "ok",
#   "pendingTasks": 0,
#   "processingTasks": 0,
#   "completedTasks": 0,
#   "failedTasks": 0,
#   "totalTasks": 0
# }
```

### 第三步：从 OpenClaw 发送任务

```bash
# 创建一个编程任务
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "创建一个简单的 hello.js 文件，输出 Hello OpenClaw",
      "files": ["hello.js"],
      "callbackUrl": "http://localhost:8080/openclaw/callback"
    }
  }'

# 返回：
# {
#   "success": true,
#   "taskId": "task-1709467200000",
#   "message": "Task created. Cursor will be notified."
# }
```

### 第四步：在 Cursor 中执行任务

在 Cursor AI 对话中输入：

```
检查 OpenClaw 任务
```

Cursor AI 会自动调用 `check_pending_tasks` 工具并显示：

```
发现 1 个待处理任务：
- [task-1709467200000] code: 创建一个简单的 hello.js 文件

使用 execute_task 来处理它们。
```

然后输入：

```
执行任务 task-1709467200000
```

Cursor AI 会：
1. 调用 `execute_task` 工具
2. 理解任务需求
3. 创建 hello.js 文件
4. 完成后调用 `report_result` 报告结果
5. MCP Server 会回调 OpenClaw

## 🔧 完整工作流程示例

### 场景：OpenClaw 委派编程任务给 Cursor

**1. OpenClaw 发送任务**

```javascript
// 在 OpenClaw 中
const response = await fetch('http://localhost:3000/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'code',
    payload: {
      description: '实现 skill-finder Phase 2，添加同义词匹配功能',
      files: [
        'skills/skill-finder/src/matcher.js',
        'skills/skill-finder/src/synonyms.js'
      ],
      callbackUrl: 'http://localhost:8080/openclaw/task-callback'
    }
  })
});

const { taskId } = await response.json();
console.log(`任务已创建: ${taskId}`);
```

**2. Cursor 检查并执行**

在 Cursor 中：

```
你：检查 OpenClaw 任务

AI：发现 1 个待处理任务：
- [task-xxx] code: 实现 skill-finder Phase 2

你：执行这个任务

AI：好的，我会实现 skill-finder Phase 2 功能...

[AI 开始编写代码]
[AI 创建 synonyms.js]
[AI 更新 matcher.js]
[AI 运行测试]

AI：完成！我已经：
1. 创建了 src/synonyms.js 文件
2. 更新了 src/matcher.js 添加同义词匹配
3. 所有测试通过

[AI 调用 report_result]

AI：结果已报告给 OpenClaw。
```

**3. OpenClaw 接收结果**

```javascript
// OpenClaw 的回调处理
app.post('/openclaw/task-callback', (req, res) => {
  const { taskId, success, result } = req.body;
  
  console.log(`✅ Cursor 完成任务 ${taskId}`);
  console.log(`结果: ${result}`);
  
  // 通知用户
  sessions_send('agent:main:main', 
    `✓ Cursor 完成任务 ${taskId}\n\n${result}`
  );
  
  res.json({ received: true });
});
```

## 🛠️ 可用的 MCP 工具

Cursor AI 可以使用以下工具：

### 1. check_pending_tasks
检查 OpenClaw 发送的待处理任务

```
你：检查 OpenClaw 任务
```

### 2. execute_task
执行指定的任务

```
你：执行任务 task-xxx
```

### 3. report_result
报告任务结果给 OpenClaw

```
AI 会自动调用此工具
```

### 4. open_file
打开并读取文件内容

```
你：打开文件 /path/to/file.js
```

### 5. run_command
运行 shell 命令

```
你：运行命令 npm test
```

## 📡 HTTP API 端点

### POST /tasks
创建新任务

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code|review|refactor",
    "payload": {
      "description": "任务描述",
      "files": ["file1.js", "file2.js"],
      "callbackUrl": "http://localhost:8080/callback"
    }
  }'
```

### GET /tasks/:taskId
查询任务状态

```bash
curl http://localhost:3000/tasks/task-xxx
```

### GET /tasks
列出所有任务

```bash
# 所有任务
curl http://localhost:3000/tasks

# 只看待处理的
curl http://localhost:3000/tasks?status=pending

# 只看已完成的
curl http://localhost:3000/tasks?status=completed
```

### DELETE /tasks/:taskId
删除任务

```bash
curl -X DELETE http://localhost:3000/tasks/task-xxx
```

### POST /cursor/open-file
让 Cursor 打开文件

```bash
curl -X POST http://localhost:3000/cursor/open-file \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/file.js"}'
```

### GET /health
健康检查

```bash
curl http://localhost:3000/health
```

## 🔄 集成到 OpenClaw

### 创建 OpenClaw Skill

```bash
mkdir -p ~/.openclaw/workspace/skills/cursor-bridge
```

创建 `SKILL.md`:

```markdown
# Cursor Bridge Skill

与 Cursor IDE 双向通信的技能。

## 使用方式

### 发送任务给 Cursor

\`\`\`javascript
const response = await fetch('http://localhost:3000/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'code',
    payload: {
      description: '任务描述',
      files: ['file.js'],
      callbackUrl: 'http://localhost:8080/callback'
    }
  })
});
\`\`\`

### 查询任务状态

\`\`\`javascript
const response = await fetch('http://localhost:3000/tasks/task-xxx');
const task = await response.json();
\`\`\`
```

## 🐛 故障排查

### Cursor 无法连接到 MCP Server

1. 检查 MCP Server 是否运行：
   ```bash
   curl http://localhost:3000/health
   ```

2. 检查 Cursor 配置是否正确
3. 重启 Cursor

### 任务没有被 Cursor 检测到

1. 在 Cursor 中手动输入：`检查 OpenClaw 任务`
2. 检查任务是否真的创建了：
   ```bash
   curl http://localhost:3000/tasks
   ```

### 回调失败

1. 确保 callbackUrl 可访问
2. 检查 OpenClaw 的回调处理是否正确

## 📚 下一步

1. **集成到 OpenClaw agents**
   - 让 coder agent 自动使用 Cursor
   - 让 thinker agent 委派任务给 Cursor

2. **添加更多任务类型**
   - 代码审查
   - 重构
   - 测试生成

3. **改进反馈机制**
   - 实时进度更新
   - 错误处理
   - 任务取消

## 🎊 完成！

你现在拥有一个完整的 OpenClaw ↔ Cursor 双向通信系统！

**测试一下：**

1. 启动 MCP Server（Cursor 会自动启动）
2. 在终端运行：`./test.sh`
3. 在 Cursor 中输入：`检查 OpenClaw 任务`
4. 享受自动化编程的乐趣！
