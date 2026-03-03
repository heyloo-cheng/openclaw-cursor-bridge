# 贡献指南

感谢你对 OpenClaw-Cursor Bridge 的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果你发现了 bug，请：

1. 检查 [Issues](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/issues) 是否已有相关报告
2. 如果没有，创建新 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（Node.js 版本、Cursor 版本、操作系统）
   - 相关日志或截图

### 提出新功能

1. 先在 [Discussions](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/discussions) 讨论
2. 说明功能的用途和价值
3. 如果获得认可，创建 Feature Request Issue

### 提交代码

1. **Fork 仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/openclaw-cursor-bridge.git
   cd openclaw-cursor-bridge
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发**
   ```bash
   npm install
   npm run build
   # 进行修改
   ```

4. **测试**
   ```bash
   npm run build
   ./test.sh
   ./full-test.sh
   ```

5. **提交**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # 或
   git commit -m "fix: fix bug description"
   ```

6. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 代码规范

### TypeScript 风格

- 使用 TypeScript 严格模式
- 添加类型注解
- 使用 JSDoc 注释
- 遵循现有代码风格

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**
```
feat(mcp): add new tool for file search

Add file_search tool to search files by pattern.
Supports glob patterns and regex.

Closes #123
```

## 🧪 测试

### 运行测试

```bash
# 构建
npm run build

# 基础测试
./test.sh

# 完整测试
./full-test.sh
```

### 添加测试

- 为新功能添加测试
- 确保所有测试通过
- 测试覆盖边界情况

## 📖 文档

### 更新文档

如果你的改动影响到：
- API - 更新 README.md 和 API.md
- 配置 - 更新 CURSOR_CONFIG.md
- 使用方式 - 更新 GETTING_STARTED.md

### 文档风格

- 清晰简洁
- 包含代码示例
- 使用 emoji 提高可读性（适度）
- 中英文混排时注意空格

## 🔍 代码审查

PR 会经过以下审查：

1. **代码质量**
   - 是否符合项目风格
   - 是否有充分的注释
   - 是否有类型安全

2. **功能完整性**
   - 是否实现了预期功能
   - 是否有测试覆盖
   - 是否有文档更新

3. **兼容性**
   - 是否破坏现有功能
   - 是否兼容旧版本

## 🎯 优先级

我们特别欢迎以下贡献：

- 🐛 Bug 修复
- 📖 文档改进
- 🧪 测试覆盖
- 🌐 国际化支持
- ⚡ 性能优化
- 🔧 新的 MCP 工具

## 💬 交流

- 💬 [Discussions](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/discussions) - 讨论功能和想法
- 🐛 [Issues](https://github.com/YOUR_USERNAME/openclaw-cursor-bridge/issues) - 报告 bug 和请求功能
- 📧 Email - your-email@example.com

## 📜 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性批评
- 关注项目目标

## 🙏 感谢

感谢所有贡献者！你们的贡献让这个项目变得更好。

---

**再次感谢你的贡献！** 🎉
