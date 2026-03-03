#!/bin/bash
# 启动 OpenClaw-Cursor Bridge MCP Server

echo "🚀 Starting OpenClaw-Cursor Bridge MCP Server"
echo "============================================"
echo ""

cd ~/.openclaw/workspace/mcp-servers/openclaw-cursor-bridge

# 检查是否已构建
if [ ! -d "dist" ]; then
  echo "⚠️  Project not built. Building now..."
  npm run build
fi

# 启动服务器
echo "✅ Starting server..."
npm start
