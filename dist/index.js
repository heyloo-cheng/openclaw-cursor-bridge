import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
const execAsync = promisify(exec);
// 任务队列
const taskQueue = [];
// ============================================
// 1. MCP Server (与 Cursor 通信)
// ============================================
const mcpServer = new Server({
    name: "openclaw-cursor-bridge",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// 注册工具列表
mcpServer.setRequestHandler("tools/list", async () => {
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
mcpServer.setRequestHandler("tools/call", async (request) => {
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
        const { taskId } = args;
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
        const { taskId, result, success } = args;
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
            }
            catch (error) {
                console.error("Failed to notify OpenClaw:", error.message);
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: `✅ Result reported to OpenClaw for task ${taskId}`,
                },
            ],
        };
    }
    // 打开文件
    if (name === "open_file") {
        const { filePath } = args;
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
        }
        catch (error) {
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
        const { command, cwd = "/Users/boton/.openclaw/workspace" } = args;
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
        }
        catch (error) {
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
app.post("/tasks", (req, res) => {
    const { type, payload } = req.body;
    if (!type || !payload) {
        return res.status(400).json({ error: "Missing type or payload" });
    }
    const task = {
        id: `task-${Date.now()}`,
        type,
        payload,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    taskQueue.push(task);
    res.json({
        success: true,
        taskId: task.id,
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
    const task = {
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
const httpServer = app.listen(PORT, () => {
    console.error(`✅ HTTP API listening on port ${PORT}`);
    console.error(`📡 Health check: http://localhost:${PORT}/health`);
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
