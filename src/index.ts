import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// 结果目录（兼容旧工作流）
const RESULT_DIR = path.join(os.homedir(), ".openclaw/workspace/data/cursor-results");

// ============================================
// 任务队列类型定义
// ============================================

interface Task {
  id: string;
  type: string;
  payload: any;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  feishuTarget?: string;  // 飞书通知目标
  workdir?: string;      // 工作目录
  source?: string;       // 任务来源: 'feishu' | 'cli' | 'api'
}

// 任务队列
const taskQueue: Task[] = [];

// 初始化结果目录
async function initResultDir() {
  try {
    await fs.mkdir(RESULT_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create result directory:", error);
  }
}

// 保存任务元数据（兼容旧工作流格式）
async function saveTaskMeta(task: Task) {
  try {
    const meta = {
      task_name: task.id,
      feishu_target: task.feishuTarget || "",
      prompt: task.payload.description || "",
      workdir: task.workdir || "",
      output_file: "TASK_REPORT.md",
      started_at: task.createdAt,
      completed_at: task.status === "completed" ? task.updatedAt : null,
      status: task.status,
    };
    
    await fs.writeFile(
      path.join(RESULT_DIR, "task-meta.json"),
      JSON.stringify(meta, null, 2)
    );
  } catch (error) {
    console.error("Failed to save task meta:", error);
  }
}

// 保存最新结果（兼容旧工作流格式）
async function saveLatestResult(task: Task) {
  try {
    const result = {
      timestamp: task.updatedAt,
      task_name: task.id,
      feishu_target: task.feishuTarget || "",
      workdir: task.workdir || "",
      output: task.result || "",
      source: "cursor-mcp",
      status: task.status,
    };
    
    await fs.writeFile(
      path.join(RESULT_DIR, "latest.json"),
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.error("Failed to save latest result:", error);
  }
}

// 保存待唤醒通知（兼容旧工作流格式）
async function savePendingWake(task: Task) {
  try {
    const wake = {
      task_name: task.id,
      feishu_target: task.feishuTarget || "",
      timestamp: task.updatedAt,
      summary: (task.result || "").substring(0, 500),
      source: "cursor-mcp",
      processed: false,
    };
    
    await fs.writeFile(
      path.join(RESULT_DIR, "pending-wake.json"),
      JSON.stringify(wake, null, 2)
    );
  } catch (error) {
    console.error("Failed to save pending wake:", error);
  }
}

// 发送飞书通知
async function sendFeishuNotification(task: Task) {
  // 只对飞书来源的任务发送通知
  if (task.source !== 'feishu') {
    console.log(`ℹ️  Task ${task.id} source is '${task.source}', skipping Feishu notification`);
    return;
  }
  
  if (!task.feishuTarget) {
    console.log(`ℹ️  Task ${task.id} has no feishuTarget, skipping notification`);
    return;
  }
  
  try {
    const summary = (task.result || "").substring(0, 800);
    const message = `🖥️ Cursor MCP 任务完成
📋 任务: ${task.id}
📝 类型: ${task.type}
✅ 状态: ${task.status}
📝 结果摘要:
${summary}`;

    // 调用 openclaw message send
    await execAsync(
      `openclaw message send --channel feishu --target "${task.feishuTarget}" --message "${message.replace(/"/g, '\\"')}"`
    );
    
    console.log(`✅ Sent Feishu notification to ${task.feishuTarget}`);
  } catch (error) {
    console.error("Failed to send Feishu notification:", error);
  }
}

// ============================================
// 1. MCP Server (与 Cursor 通信)
// ============================================

const mcpServer = new Server(
  {
    name: "openclaw-cursor-bridge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_pending_tasks",
        description: "Check if there are pending tasks from OpenClaw",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "execute_task",
        description: "Execute a task from OpenClaw",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID to execute",
            },
          },
          required: ["taskId"],
        },
      },
      {
        name: "report_result",
        description: "Report task result back to OpenClaw",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID",
            },
            result: {
              type: "string",
              description: "Task result",
            },
            success: {
              type: "boolean",
              description: "Whether task succeeded",
            },
          },
          required: ["taskId", "result", "success"],
        },
      },
      {
        name: "open_file",
        description: "Open a file and return its content",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "File path to open",
            },
          },
          required: ["filePath"],
        },
      },
      {
        name: "run_command",
        description: "Run a shell command",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Command to run",
            },
            cwd: {
              type: "string",
              description: "Working directory",
              default: "/Users/boton/.openclaw/workspace",
            },
          },
          required: ["command"],
        },
      },
    ],
  };
});

// 实现工具调用
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 检查待处理任务
  if (name === "check_pending_tasks") {
    const pendingTasks = taskQueue.filter((t) => t.status === "pending");

    if (pendingTasks.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No pending tasks from OpenClaw.",
          },
        ],
      };
    }

    const taskList = pendingTasks
      .map((t) => `- [${t.id}] ${t.type}: ${JSON.stringify(t.payload)}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${pendingTasks.length} pending task(s):\n\n${taskList}\n\nUse execute_task to process them.`,
        },
      ],
    };
  }

  // 执行任务
  if (name === "execute_task") {
    const { taskId } = args as { taskId: string };
    const task = taskQueue.find((t) => t.id === taskId);

    if (!task) {
      return {
        content: [{ type: "text", text: `Task ${taskId} not found.` }],
        isError: true,
      };
    }

    task.status = "processing";
    task.updatedAt = new Date().toISOString();

    // 根据任务类型返回指令
    if (task.type === "code") {
      return {
        content: [
          {
            type: "text",
            text: `📝 Task: ${task.payload.description}\n\nFiles to modify:\n${task.payload.files.join("\n")}\n\nPlease implement this task and use report_result when done.`,
          },
        ],
      };
    }

    if (task.type === "review") {
      return {
        content: [
          {
            type: "text",
            text: `🔍 Please review the following files:\n${task.payload.files.join("\n")}\n\nFocus on: ${task.payload.focus}\n\nUse report_result to send your review.`,
          },
        ],
      };
    }

    if (task.type === "refactor") {
      return {
        content: [
          {
            type: "text",
            text: `♻️ Refactor task: ${task.payload.description}\n\nFiles: ${task.payload.files.join(", ")}\n\nUse report_result when done.`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown task type: ${task.type}` }],
      isError: true,
    };
  }

  // 报告结果
  if (name === "report_result") {
    const { taskId, result, success } = args as {
      taskId: string;
      result: string;
      success: boolean;
    };

    const task = taskQueue.find((t) => t.id === taskId);
    if (!task) {
      return {
        content: [{ type: "text", text: `Task ${taskId} not found.` }],
        isError: true,
      };
    }

    task.status = success ? "completed" : "failed";
    task.result = result;
    task.updatedAt = new Date().toISOString();

    // 保存结果到文件（兼容旧工作流）
    await saveTaskMeta(task);
    await saveLatestResult(task);
    await savePendingWake(task);

    // 发送飞书通知
    await sendFeishuNotification(task);

    // 通知 OpenClaw（通过 HTTP 回调）
    if (task.payload.callbackUrl) {
      try {
        const response = await fetch(task.payload.callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            success,
            result,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          console.error("Failed to notify OpenClaw:", response.statusText);
        }
      } catch (error: any) {
        console.error("Failed to notify OpenClaw:", error.message);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Result reported to OpenClaw for task ${taskId}\n📁 Results saved to ${RESULT_DIR}\n${task.feishuTarget ? `📱 Feishu notification sent to ${task.feishuTarget}` : ""}`,
        },
      ],
    };
  }

  // 打开文件
  if (name === "open_file") {
    const { filePath } = args as { filePath: string };

    try {
      // 检查文件是否存在
      await fs.access(filePath);

      // 读取文件内容
      const content = await fs.readFile(filePath, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `📄 File: ${filePath}\n\n\`\`\`\n${content}\n\`\`\``,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to open file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // 运行命令
  if (name === "run_command") {
    const { command, cwd = "/Users/boton/.openclaw/workspace" } = args as {
      command: string;
      cwd?: string;
    };

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });

      return {
        content: [
          {
            type: "text",
            text: `💻 Command: ${command}\n\n📤 Output:\n${stdout || "(no output)"}\n\n${stderr ? `⚠️ Errors:\n${stderr}` : ""}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Command failed: ${error.message}\n\n${error.stdout || ""}\n${error.stderr || ""}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ============================================
// 2. HTTP API (与 OpenClaw 通信)
// ============================================

const app = express();
app.use(express.json());

// 健康检查
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    pendingTasks: taskQueue.filter((t) => t.status === "pending").length,
    processingTasks: taskQueue.filter((t) => t.status === "processing").length,
    completedTasks: taskQueue.filter((t) => t.status === "completed").length,
    failedTasks: taskQueue.filter((t) => t.status === "failed").length,
    totalTasks: taskQueue.length,
  });
});

// 创建任务（OpenClaw 调用）
app.post("/tasks", async (req, res) => {
  const { type, payload, feishuTarget, workdir, source } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: "Missing type or payload" });
  }

  // 自动检测任务来源
  // - 如果有 feishuTarget 且是通过飞书发送的 → feishu
  // - 如果请求头包含 feishu 相关标识 → feishu
  // - 否则 → cli 或 api
  let taskSource = source || 'cli';
  if (!taskSource || taskSource === 'cli') {
    // 检查请求是否来自飞书（通过 header 或 feishuTarget 判断）
    const isFromFeishu = feishuTarget || 
                         payload?.feishuTarget ||
                         req.headers['x-feishu-from'] === 'true' ||
                         req.headers['x-source'] === 'feishu';
    if (isFromFeishu) {
      taskSource = 'feishu';
    }
  }

  const task: Task = {
    id: `task-${Date.now()}`,
    type,
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    feishuTarget: feishuTarget || payload.feishuTarget,
    workdir: workdir || payload.workdir,
    source: taskSource,
  };

  taskQueue.push(task);

  // 保存任务元数据
  await saveTaskMeta(task);

  console.log(`📝 Task created: ${task.id} (source: ${task.source})`);

  res.json({
    success: true,
    taskId: task.id,
    source: task.source,
    message: "Task created. Cursor will be notified.",
  });
});

// 获取任务状态
app.get("/tasks/:taskId", (req, res) => {
  const task = taskQueue.find((t) => t.id === req.params.taskId);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

// 获取所有任务
app.get("/tasks", (req, res) => {
  const { status } = req.query;

  let tasks = taskQueue;
  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  res.json({ tasks, total: tasks.length });
});

// 删除任务
app.delete("/tasks/:taskId", (req, res) => {
  const index = taskQueue.findIndex((t) => t.id === req.params.taskId);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  taskQueue.splice(index, 1);
  res.json({ success: true, message: "Task deleted" });
});

// 控制 Cursor 打开文件（OpenClaw 调用）
app.post("/cursor/open-file", async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "Missing filePath" });
  }

  // 创建一个特殊任务，让 Cursor 打开文件
  const task: Task = {
    id: `cursor-${Date.now()}`,
    type: "cursor-action",
    payload: {
      action: "open_file",
      filePath,
    },
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  taskQueue.push(task);

  res.json({
    success: true,
    message: `File open request sent to Cursor: ${filePath}`,
    taskId: task.id,
  });
});

// 启动 HTTP 服务器
const PORT = process.env.PORT || 3000;
const httpServer = app.listen(PORT, async () => {
  console.error(`✅ HTTP API listening on port ${PORT}`);
  console.error(`📡 Health check: http://localhost:${PORT}/health`);
  console.error(`📁 Result directory: ${RESULT_DIR}`);
  
  // 初始化结果目录
  await initResultDir();
});

// ============================================
// 3. 启动 MCP Server
// ============================================

const transport = new StdioServerTransport();
await mcpServer.connect(transport);

console.error("✅ OpenClaw-Cursor Bridge MCP Server started");
console.error("🔧 Available tools:");
console.error("  - check_pending_tasks");
console.error("  - execute_task");
console.error("  - report_result");
console.error("  - open_file");
console.error("  - run_command");

// 优雅关闭
process.on("SIGINT", () => {
  console.error("\n🛑 Shutting down...");
  httpServer.close();
  process.exit(0);
});
