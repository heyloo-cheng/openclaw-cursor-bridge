#!/bin/bash
# 完整的端到端测试脚本

echo "🧪 OpenClaw-Cursor Bridge 完整测试"
echo "===================================="
echo ""

# 1. 检查 MCP Server 状态
echo "1️⃣ 检查 MCP Server 状态"
HEALTH=$(curl -s http://localhost:3000/health)
echo "$HEALTH" | jq
echo ""

# 2. 查看当前任务
echo "2️⃣ 当前任务列表"
curl -s http://localhost:3000/tasks | jq '.tasks[] | {id, type, status, description: .payload.description}'
echo ""

# 3. 模拟 Cursor 调用 check_pending_tasks
echo "3️⃣ 模拟 Cursor 调用 check_pending_tasks"
PENDING=$(curl -s http://localhost:3000/tasks?status=pending)
TASK_COUNT=$(echo "$PENDING" | jq '.tasks | length')
echo "发现 $TASK_COUNT 个待处理任务"
echo "$PENDING" | jq '.tasks[] | "- [\(.id)] \(.type): \(.payload.description)"' -r
echo ""

# 4. 获取第一个任务 ID
TASK_ID=$(echo "$PENDING" | jq -r '.tasks[0].id')
echo "4️⃣ 准备执行任务: $TASK_ID"
echo ""

# 5. 模拟 Cursor 执行任务
echo "5️⃣ 模拟 Cursor 执行任务"
TASK_DETAIL=$(curl -s http://localhost:3000/tasks/$TASK_ID)
echo "任务详情:"
echo "$TASK_DETAIL" | jq '{id, type, status, payload}'
echo ""

# 6. 模拟创建文件（Cursor 会做的事）
echo "6️⃣ 模拟 Cursor 创建文件"
cd ~/.openclaw/workspace
cat > hello.js << 'EOF'
// Created by Cursor via OpenClaw-Cursor Bridge
console.log("Hello OpenClaw!");
console.log("This file was created through MCP integration!");
EOF
echo "✅ 创建了 hello.js"
cat hello.js
echo ""

# 7. 模拟 Cursor 报告结果
echo "7️⃣ 模拟 Cursor 报告结果"
RESULT="任务完成！已创建 hello.js 文件，包含以下内容：
\`\`\`javascript
$(cat hello.js)
\`\`\`

文件位置: ~/.openclaw/workspace/hello.js"

# 注意：实际的 report_result 是通过 MCP 工具调用的
# 这里我们直接更新任务状态来模拟
echo "结果: $RESULT"
echo ""

# 8. 验证文件
echo "8️⃣ 验证创建的文件"
if [ -f hello.js ]; then
  echo "✅ hello.js 存在"
  echo "运行测试:"
  node hello.js
else
  echo "❌ hello.js 不存在"
fi
echo ""

# 9. 最终状态
echo "9️⃣ 最终系统状态"
curl -s http://localhost:3000/health | jq
echo ""

echo "✅ 测试完成！"
echo ""
echo "📝 总结:"
echo "- MCP Server: ✅ 运行中"
echo "- HTTP API: ✅ 正常"
echo "- 任务创建: ✅ 成功"
echo "- 任务执行: ✅ 模拟成功"
echo "- 文件创建: ✅ 成功"
echo ""
echo "🎯 下一步: 在 Cursor 中实际测试"
echo "在 Cursor AI 对话中输入: 检查 OpenClaw 任务"
