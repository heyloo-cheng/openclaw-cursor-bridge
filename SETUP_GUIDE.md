# Cursor MCP 配置 - 复制粘贴版

## 📋 配置步骤

### 1. 打开 Cursor 设置文件

**方式 1：通过 Cursor**
1. 打开 Cursor
2. 按 `Cmd + Shift + P` 打开命令面板
3. 输入 "Preferences: Open User Settings (JSON)"
4. 回车

**方式 2：直接编辑文件**
```bash
open ~/Library/Application\ Support/Cursor/User/settings.json
```

### 2. 添加 MCP 配置

在 settings.json 中添加以下内容（保留现有配置）：

```json
{
    "window.commandCenter": true,
    "cursor.general.disableHttp2": true,
    "claudeCode.preferredLocation": "panel",
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

### 3. 保存并重启 Cursor

保存文件后，完全退出 Cursor 并重新打开。

### 4. 验证配置

重启 Cursor 后，MCP Server 会自动启动。你可以验证：

**方式 1：检查 HTTP API**
```bash
curl http://localhost:3000/health
```

应该返回：
```json
{
  "status": "ok",
  "pendingTasks": 0,
  "processingTasks": 0,
  "completedTasks": 0,
  "failedTasks": 0,
  "totalTasks": 0
}
```

**方式 2：在 Cursor 中测试**

在 Cursor AI 对话中输入：
```
检查 OpenClaw 任务
```

如果配置成功，AI 会调用 `check_pending_tasks` 工具并返回结果。

## 🧪 完整测试流程

### 第一步：创建测试任务

在终端运行：
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "创建一个简单的 hello.js 文件，输出 Hello OpenClaw",
      "files": ["hello.js"]
    }
  }'
```

### 第二步：在 Cursor 中检查任务

在 Cursor AI 对话中输入：
```
检查 OpenClaw 任务
```

AI 应该返回：
```
发现 1 个待处理任务：
- [task-xxx] code: 创建一个简单的 hello.js 文件

使用 execute_task 来处理它们。
```

### 第三步：执行任务

在 Cursor 中输入：
```
执行任务 task-xxx
```

（替换 task-xxx 为实际的任务 ID）

AI 会：
1. 理解任务需求
2. 创建 hello.js 文件
3. 写入代码
4. 报告结果

### 第四步：验证结果

检查是否创建了 hello.js 文件：
```bash
cat hello.js
```

## 🐛 故障排查

### 问题 1：curl 连接失败

**症状：**
```bash
curl: (7) Failed to connect to localhost port 3000
```

**原因：** MCP Server 没有启动

**解决：**
1. 确保 Cursor 已经重启
2. 检查 settings.json 配置是否正确
3. 查看 Cursor 的开发者工具（Help → Toggle Developer Tools）查看错误

### 问题 2：Cursor AI 无法调用工具

**症状：** AI 说"我无法访问该工具"

**原因：** MCP 配置未生效

**解决：**
1. 完全退出 Cursor（Cmd + Q）
2. 重新打开 Cursor
3. 等待几秒让 MCP Server 启动

### 问题 3：任务创建成功但 Cursor 看不到

**症状：** curl 返回成功，但 Cursor 中 `check_pending_tasks` 返回空

**原因：** 可能是不同的 MCP Server 实例

**解决：**
1. 检查端口是否正确（3000）
2. 确保只有一个 Cursor 实例在运行

## 📝 快速命令参考

```bash
# 健康检查
curl http://localhost:3000/health

# 创建任务
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"code","payload":{"description":"测试任务","files":["test.js"]}}'

# 查看所有任务
curl http://localhost:3000/tasks

# 查看待处理任务
curl http://localhost:3000/tasks?status=pending

# 查看任务详情
curl http://localhost:3000/tasks/task-xxx
```

## ✅ 配置完成检查清单

- [ ] settings.json 已更新
- [ ] Cursor 已重启
- [ ] `curl http://localhost:3000/health` 返回成功
- [ ] Cursor AI 可以调用 `check_pending_tasks`
- [ ] 可以创建和执行测试任务

全部完成后，你的 OpenClaw ↔ Cursor 双向通信系统就可以使用了！🎉
