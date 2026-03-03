#!/bin/bash
# 测试 OpenClaw-Cursor Bridge MCP Server

echo "🧪 Testing OpenClaw-Cursor Bridge MCP Server"
echo "============================================"
echo ""

# 1. 健康检查
echo "1️⃣ Health Check"
curl -s http://localhost:3000/health | jq
echo ""

# 2. 创建编程任务
echo "2️⃣ Creating a coding task"
TASK_RESPONSE=$(curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code",
    "payload": {
      "description": "创建一个简单的 hello.js 文件，输出 Hello OpenClaw",
      "files": ["hello.js"],
      "callbackUrl": "http://localhost:8080/openclaw/callback"
    }
  }')

echo "$TASK_RESPONSE" | jq
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.taskId')
echo ""

# 3. 查询任务状态
echo "3️⃣ Checking task status"
curl -s http://localhost:3000/tasks/$TASK_ID | jq
echo ""

# 4. 列出所有任务
echo "4️⃣ Listing all tasks"
curl -s http://localhost:3000/tasks | jq
echo ""

# 5. 创建文件打开请求
echo "5️⃣ Requesting Cursor to open a file"
curl -s -X POST http://localhost:3000/cursor/open-file \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/Users/boton/.openclaw/workspace/README.md"
  }' | jq
echo ""

echo "✅ Test completed!"
echo ""
echo "📝 Next steps:"
echo "1. Open Cursor"
echo "2. In Cursor AI chat, type: 检查 OpenClaw 任务"
echo "3. Cursor will show the pending task"
echo "4. Type: 执行任务 $TASK_ID"
echo "5. Cursor will execute the task and report results"
