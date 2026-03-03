# OpenClaw-Cursor Bridge

🔗 **双向通信桥梁：OpenClaw ↔ Cursor IDE**

通过 MCP (Model Context Protocol) 实现 OpenClaw 与 Cursor IDE 之间的完整双向通信，支持任务派发、执行反馈、结果通知。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## ✨ 特性

### 🔄 双向通信
- **OpenClaw → Cursor**: 通过 HTTP API 发送编程任务
- **Cursor → OpenClaw**: 通过 MCP 工具查询任务、报告结果
- **OpenClaw → Cursor**: 通过 MCP 工具控制 Cursor 操作

### 🛠️ MCP 工具 (5 个)
- `check_pending_tasks` - 检查待处理任务
- `execute_task` - 执行指定任务
- `report_result` - 报告任务完成结果
- `open_file` - 打开文件
- `run_command` - 执行 shell 命令

### 🌐 HTTP API (7 个端点)
- `GET /health` - 健康检查
- `POST /tasks` - 创建任务
- `GET /tasks` - 列出所有任务
- `GET /tasks/:id` - 查询任务详情
- `DELETE /tasks/:id` - 删除任务
- `POST /cursor/open-file` - 控制 Cursor 打开文件
- `GET /tasks?status=pending` - 过滤任务

### 📁 结果管理
- 兼容旧工作流的结果目录格式
- 自动保存 `task-meta.json`, `latest.json`, `pending-wake.json`
- 支持飞书通知集成
- 工作目录跟踪

### 🎯 任务类型
- `code` - 编程任务
- `review` - 代码审查
- `refactor` - 重构
- `cursor-action` - Cursor 控制操作

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- Cursor IDE
- OpenClaw (可选，用于完整集成)

### 安装

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/openclaw-cursor-bridge.git
cd openclaw-cursor-bridge

# 安装依赖
npm install

# 构建项目
npm run build
```

### 配置 Cursor

1. 打开 Cursor Settings (`Cmd + ,`)
2. 找到 "Tools & MCP"
3. 点击 "Add MCP Server"
4. 填写配置：
   - **Name**: `openclaw-bridge`
   - **Command**: `node`
   - **Args**: `/path/to/openclaw-cursor-bridge/dist/index.js`
   - **Environment Variables**: `PORT=3000`
5. 启用 MCP Server
6. 重启 Cursor

详细配置步骤见 [CURSOR_CONFIG.md](./CURSOR_CONFIG.md)

### 测试

```bash
# 启动服务器（测试用）
npm start

# 在另一个终端创建测试任务
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "创建一个 hello.js 文件",
      "files": ["hello.js"]
    }
  }'

# 在 Cursor AI 中输入
# "使用 check_pending_tasks 检查待处理任务"
```

---

## 📖 使用指南

### 从 OpenClaw 发送任务

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "实现用户登录功能",
      "files": ["auth.ts", "login.tsx"]
    },
    "feishuTarget": "oc_xxx",
    "workdir": "/path/to/project"
  }'
```

### 在 Cursor 中处理任务

1. **检查任务**
   ```
   使用 check_pending_tasks 检查待处理任务
   ```

2. **执行任务**
   ```
   使用 execute_task 执行任务 task-xxx
   ```

3. **报告结果**
   ```
   使用 report_result 报告任务完成
   ```

详细使用指南见 [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 🏗️ 架构

```
┌─────────────┐         HTTP API          ┌──────────────┐
│  OpenClaw   │ ────────────────────────> │  MCP Server  │
│             │                            │              │
│  - main     │ <──────────────────────── │  - Express   │
│  - coder    │      Callback/Notify      │  - Task Queue│
│  - thinker  │                            │              │
└─────────────┘                            └──────┬───────┘
                                                  │
                                                  │ MCP Protocol
                                                  │ (stdio)
                                                  │
                                           ┌──────▼───────┐
                                           │  Cursor IDE  │
                                           │              │
                                           │  - AI Chat   │
                                           │  - MCP Tools │
                                           └──────────────┘
```

### 工作流程

1. **任务创建**: OpenClaw 通过 HTTP POST 创建任务
2. **任务查询**: Cursor 通过 MCP 工具 `check_pending_tasks` 查询
3. **任务执行**: Cursor 通过 MCP 工具 `execute_task` 获取任务详情
4. **结果报告**: Cursor 通过 MCP 工具 `report_result` 报告完成
5. **结果保存**: 自动保存到结果目录
6. **飞书通知**: 自动发送通知（如果配置）

---

## 📁 项目结构

```
openclaw-cursor-bridge/
├── src/
│   ├── index.ts              # 主服务器代码
│   └── utils/
│       ├── task-helper.ts    # 任务工具函数
│       └── task-helper.test.ts
├── dist/                     # 编译输出
├── docs/                     # 文档
│   ├── CURSOR_CONFIG.md      # Cursor 配置指南
│   ├── GETTING_STARTED.md    # 使用指南
│   └── SETUP_GUIDE.md        # 详细设置指南
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 配置

### 环境变量

- `PORT` - HTTP API 端口（默认: 3000）

### 结果目录

默认位置: `~/.openclaw/workspace/data/cursor-results/`

文件格式:
- `task-meta.json` - 任务元数据
- `latest.json` - 最新结果
- `pending-wake.json` - 待处理通知

---

## 🧪 开发

### 构建

```bash
npm run build
```

### 测试

```bash
# 运行测试脚本
./test.sh

# 完整端到端测试
./full-test.sh
```

### 调试

```bash
# 启动服务器并查看日志
npm start

# 查看 MCP Server 日志
tail -f /tmp/mcp-server.log
```

---

## 📊 API 文档

### POST /tasks

创建新任务

**请求体:**
```json
{
  "type": "code",
  "payload": {
    "description": "任务描述",
    "files": ["file1.ts", "file2.ts"]
  },
  "feishuTarget": "oc_xxx",
  "workdir": "/path/to/project"
}
```

**响应:**
```json
{
  "success": true,
  "taskId": "task-1234567890",
  "message": "Task created. Cursor will be notified."
}
```

### GET /tasks

列出所有任务

**响应:**
```json
{
  "tasks": [
    {
      "id": "task-xxx",
      "type": "code",
      "status": "pending",
      "payload": {...},
      "createdAt": "2026-03-03T08:00:00.000Z"
    }
  ],
  "total": 1
}
```

完整 API 文档见 [API.md](./docs/API.md)

---

## 🎯 使用场景

### 1. 自动化编程任务

OpenClaw 分析需求后，自动派发编程任务给 Cursor 执行。

### 2. 代码审查

OpenClaw 检测到 PR 后，派发审查任务给 Cursor。

### 3. 重构任务

OpenClaw 识别需要重构的代码，派发重构任务。

### 4. 多 Agent 协作

OpenClaw 的多个 agent 可以协同使用 Cursor 完成复杂任务。

---

## 🔄 迁移说明

### 从旧的 Cursor 工作流迁移

本项目完全兼容旧的 Cursor 工作流（基于 AppleScript），并提供以下改进：

- ✅ 官方 MCP 支持（更可靠）
- ✅ 双向通信（不仅派发，还能反馈）
- ✅ 保留所有旧功能（结果目录、飞书通知）
- ✅ 更好的错误处理
- ✅ TypeScript 类型安全

详见 [MIGRATION.md](./docs/MIGRATION.md)

---

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

---

## 🙏 致谢

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Cursor IDE](https://cursor.com/)
- [OpenClaw](https://openclaw.ai/)

---

## 📞 支持

- 📖 [文档](./docs/)
- 🐛 [问题反馈](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/issues)
- 💬 [讨论区](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/discussions)

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
