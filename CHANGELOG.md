# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-03-04

### Added
- 🚀 多版本自动化脚本系统
  - `cursor-task-create.sh` - 简化版（最可靠）
  - `cursor-mcp-auto2.sh` - v2 自动化
  - `cursor-mcp-v3.sh` - v3 增强版（推荐）
  - `cursor-mcp-smart.sh` - v7 超智能版
  - `cursor-aliases.sh` - 快捷命令别名
- 📚 完整的脚本使用文档 (`scripts/README.md`)
- 🎯 任务来源标识 (`source` 字段)
- 🔔 智能飞书通知（只对飞书来源任务发送）

### Changed
- 🔧 MCP Bridge 默认端口改为 2099
- 📝 优化任务创建流程，自动检测来源
- 🎨 改进日志输出格式

### Fixed
- 🐛 修复 CLI 任务触发不必要的飞书通知
- 🔧 修复端口冲突问题

## [1.1.0] - 2026-03-04

### Added
- 📦 OpenClaw 插件集成 (`OPENCLAW_PLUGIN.md`)
- 🛠️ 5 个 MCP 工具
  - `cursor_execute` - 执行任务
  - `cursor_list_tasks` - 列出任务
  - `cursor_get_task` - 获取任务详情
  - `cursor_open_file` - 打开文件
  - `cursor_health` - 健康检查

### Changed
- 📚 完善文档结构
- 🎨 优化 API 响应格式

## [1.0.0] - 2026-03-03

### Added
- 🎉 初始版本发布
- 🔄 完整的双向通信架构
- 📡 HTTP API (7 个端点)
- 🛠️ MCP 工具 (5 个)
- 📁 结果管理系统
- 🔔 飞书通知集成
- 📖 完整文档

### Features
- OpenClaw → Cursor 任务派发
- Cursor → OpenClaw 结果反馈
- 任务队列管理
- 工作目录跟踪
- 自动保存结果

---

**版本说明**:
- 1.0.x - 基础功能
- 1.1.x - OpenClaw 集成
- 1.2.x - 自动化脚本系统

**升级建议**:
- 从 1.0.x → 1.1.x: 无需修改，向后兼容
- 从 1.1.x → 1.2.x: 建议更新 MCP Bridge 端口配置
