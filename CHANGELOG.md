# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-04

### Added

- **OpenClaw Plugin Integration** - Direct integration with OpenClaw
  - New `OPENCLAW_PLUGIN.md` documentation
  - 5 tools available in OpenClaw: `cursor_execute`, `cursor_list_tasks`, `cursor_get_task`, `cursor_open_file`, `cursor_health`
  - Complete workflow documentation
  - Architecture diagrams
  - Testing instructions

### Changed

- Updated `README.md` with OpenClaw Plugin announcement
- Enhanced documentation structure

### Documentation

- Added comprehensive OpenClaw integration guide
- Documented complete bidirectional workflow
- Added testing examples

## [1.0.0] - 2026-03-03

### Added

- Initial release of OpenClaw-Cursor Bridge
- MCP Server implementation
- HTTP API with 7 endpoints
- 5 MCP tools for Cursor
- Task queue management
- Result directory compatibility
- Feishu notification support
- Complete documentation suite

### Features

- Bidirectional communication (OpenClaw ↔ Cursor)
- Task lifecycle management
- Multiple task types support
- Working directory tracking
- Error handling and recovery

---

## Links

- [GitHub Repository](https://github.com/heyloo-cheng/openclaw-cursor-bridge)
- [OpenClaw Plugin Guide](./OPENCLAW_PLUGIN.md)
- [Getting Started](./GETTING_STARTED.md)
