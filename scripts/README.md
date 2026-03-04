# 🚀 Cursor MCP 自动化脚本

这个目录包含多个版本的 Cursor MCP 自动化脚本，从简单到复杂，满足不同需求。

## 📊 脚本对比

| 脚本 | 版本 | 自动化程度 | 可靠性 | 推荐场景 |
|------|------|-----------|--------|---------|
| `cursor-task-create.sh` | 简化版 | 50% | ⭐⭐⭐⭐⭐ | 新手、追求稳定 |
| `cursor-mcp-auto2.sh` | v2 | 85% | ⭐⭐⭐⭐ | 日常开发 |
| `cursor-mcp-v3.sh` | v3 | 90% | ⭐⭐⭐⭐ | 日常开发（推荐） |
| `cursor-mcp-smart.sh` | v7 | 95% | ⭐⭐⭐⭐⭐ | 复杂任务、批量处理 |

## 🎯 快速开始

### 方案 1: 简单可靠（推荐新手）

```bash
# 1. 创建任务
./cursor-task-create.sh "创建 hello.ts 文件" '["hello.ts"]'

# 2. 在 Cursor Agent 中手动执行
使用 check_pending_tasks 检查待处理任务
使用 execute_task 执行任务 task-xxx
```

**优点**: 100% 可靠，30 秒完成  
**缺点**: 需要手动输入 2 条命令

### 方案 2: 半自动化（推荐日常）

```bash
# v3 版本 - 自动发送命令
./cursor-mcp-v3.sh "创建 hello.ts 文件" '["hello.ts"]'
```

**优点**: 自动发送命令，只需点击"允许"  
**缺点**: AppleScript 可能不稳定

### 方案 3: 超智能版（推荐高级）

```bash
# v7 版本 - 完整自动化
./cursor-mcp-smart.sh "创建 hello.ts 文件" '["hello.ts"]'
```

**优点**: 上下文记忆，智能诊断，流式输出  
**缺点**: 复杂度高

## 📋 详细说明

### cursor-task-create.sh

**最简单、最可靠的方式**

```bash
./cursor-task-create.sh <description> <files> [workdir]
```

**示例**:
```bash
./cursor-task-create.sh "实现登录功能" '["auth.ts", "login.tsx"]'
```

**工作流**:
1. 脚本创建任务到 MCP Bridge
2. 手动在 Cursor Agent 中输入 2 条命令
3. 点击"允许"
4. 完成

### cursor-mcp-v3.sh

**增强版自动化（推荐）**

```bash
./cursor-mcp-v3.sh <description> <files> [workdir] [wait] [source]
```

**示例**:
```bash
./cursor-mcp-v3.sh "实现登录功能" '["auth.ts"]' "/path/to/project" "yes" "cli"
```

**特点**:
- ✅ 自动启动 Cursor
- ✅ 自动发送命令到 Agent
- ✅ 自动等待任务完成
- ⚠️ 需要手动点击"允许"

### cursor-mcp-smart.sh

**超智能版（v7）**

```bash
./cursor-mcp-smart.sh <description> <files> [workdir]
```

**特点**:
- ✅ 上下文记忆（多步骤任务）
- ✅ 智能错误诊断和重试
- ✅ 实时流式输出
- ✅ WebSocket 事件驱动
- ✅ 自动修复常见问题

### cursor-aliases.sh

**快捷命令别名**

```bash
source ./cursor-aliases.sh
```

**提供的别名**:
- `cursor-task` - 创建任务
- `cursor-tasks` - 查看待处理任务
- `cursor-all-tasks` - 查看所有任务
- `cursor-task-info` - 查看任务详情
- `cursor-bridge-start` - 启动 MCP Bridge
- `cursor-bridge-stop` - 停止 MCP Bridge

## 🔧 前置要求

1. **MCP Bridge 运行中**
   ```bash
   curl -s http://localhost:2099/health
   ```

2. **Cursor 已配置 MCP Server**
   - 打开 Cursor Settings
   - 找到 "MCP Servers"
   - 确认 `openclaw-bridge` 已启用

3. **Node.js >= 18.0.0**

## 💡 使用技巧

### 技巧 1: 批量创建任务

```bash
for task in "任务1" "任务2" "任务3"; do
    ./cursor-task-create.sh "$task" '["file.ts"]'
    sleep 1
done
```

### 技巧 2: 配置全局别名

在 `~/.zshrc` 或 `~/.bashrc` 中添加:

```bash
alias cursor-task='~/path/to/cursor-task-create.sh'
alias cursor-auto='~/path/to/cursor-mcp-v3.sh'
```

### 技巧 3: 查看任务状态

```bash
# 查看所有待处理任务
curl -s 'http://localhost:2099/tasks?status=pending' | jq '.tasks'

# 查看特定任务
curl -s http://localhost:2099/tasks/task-xxx | jq '.'
```

## 🐛 故障排查

### 问题 1: MCP Bridge 未运行

```bash
# 检查状态
curl -s http://localhost:2099/health

# 如果失败，重启 Cursor（会自动启动 MCP Bridge）
```

### 问题 2: Cursor 不识别 MCP 工具

1. 打开 Cursor Settings
2. 找到 "MCP Servers"
3. 确认 `openclaw-bridge` 已启用
4. 重启 Cursor

### 问题 3: AppleScript 不工作

使用简化版脚本 `cursor-task-create.sh`，手动执行更可靠。

## 📚 相关文档

- [最佳实践](../CURSOR_MCP_BEST_PRACTICE.md)
- [实现报告](../IMPLEMENTATION_REPORT.md)
- [使用指南](../USAGE.md)

## 🎉 总结

**推荐使用顺序**:
1. 新手 → `cursor-task-create.sh`
2. 熟悉后 → `cursor-mcp-v3.sh`
3. 高级用户 → `cursor-mcp-smart.sh`

**核心原则**: 简单可靠 > 完全自动化

---

**更新时间**: 2026-03-04  
**版本**: v3 / v7
