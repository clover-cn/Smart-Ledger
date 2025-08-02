import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server as mcpServer } from "./mcp-server.js";  // 重命名以避免命名冲突

// 格式化时间函数
function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 存储活跃连接
const connections = new Map();

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: formatTimestamp(),
    connections: connections.size
  });
});

// SSE 连接建立端点
app.get("/sse", async (req, res) => {
  // 实例化SSE传输对象
  const transport = new SSEServerTransport("/messages", res);
  // 获取sessionId
  const sessionId = transport.sessionId;
  console.log(`[${formatTimestamp()}] 新的SSE连接建立: ${sessionId}`);

  // 注册连接
  connections.set(sessionId, transport);
  
  // 连接中断处理
  req.on('close', () => {
    console.log(`[${formatTimestamp()}] SSE连接关闭: ${sessionId}`);
    connections.delete(sessionId);
  });
  
  // 将传输对象与MCP服务器连接
  await mcpServer.connect(transport);
  console.log(`[${formatTimestamp()}] MCP服务器连接成功: ${sessionId}`);

  // 发送心跳包以保持连接，防止连接中断（可以不需要心跳检测）
  const heartbeatInterval = setInterval(() => {
    try {
      // 检查连接是否仍然有效
      if (!res.headersSent || res.destroyed) {
        clearInterval(heartbeatInterval);
        return;
      }
      res.write('event: heartbeat\ndata: ' + JSON.stringify({
        timestamp: Date.now(),
        sessionId: sessionId
      }) + '\n\n');
      console.log(`[${formatTimestamp()}] 心跳发送成功: ${sessionId}`);
      
    } catch (error) {
      console.error(`[${formatTimestamp()}] 心跳发送失败: ${sessionId}`, error);
      clearInterval(heartbeatInterval);
      connections.delete(sessionId);
    }
  }, 30000);
  
  // 监听连接关闭事件
  req.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  // 监听连接错误事件
  req.on('error', (error) => {
    console.error(`[${formatTimestamp()}] SSE连接错误: ${sessionId}`, error);
    clearInterval(heartbeatInterval);
    connections.delete(sessionId);
  });
  
});

// 接收客户端消息的端点
app.post("/messages", async (req: Request, res: Response) => {
  try {
    console.log(`[${formatTimestamp()}] 收到客户端消息:`, req.query);
    const sessionId = req.query.sessionId as string;
    
    // 查找对应的SSE连接并处理消息
    if (connections.size > 0) {
      // 获取第一个可用的传输对象（在生产环境中应该使用更精确的匹配机制）
      const transport: SSEServerTransport = connections.get(sessionId) as SSEServerTransport;
      // 使用transport处理消息
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        throw new Error('没有活跃的SSE连接');
      }
    } else {
      throw new Error('没有活跃的SSE连接');
    }
  } catch (error: any) {
    console.error(`[${formatTimestamp()}] 处理客户端消息失败:`, error);
    res.status(500).json({ error: '处理消息失败', message: error.message });
  }
});

// 优雅关闭所有连接
async function closeAllConnections() {
  console.log(`[${formatTimestamp()}] 关闭所有连接 (${connections.size}个)`);
  for (const [id, transport] of connections.entries()) {
    try {
      // 发送关闭事件
      transport.res.write('event: server_shutdown\ndata: {"reason": "Server is shutting down"}\n\n');
      transport.res.end();
      console.log(`[${formatTimestamp()}] 已关闭连接: ${id}`);
    } catch (error) {
      console.error(`[${formatTimestamp()}] 关闭连接失败: ${id}`, error);
    }
  }
  connections.clear();
}

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${formatTimestamp()}] 未处理的异常:`, err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log(`[${formatTimestamp()}] 接收到SIGTERM信号，准备关闭`);
  await closeAllConnections();
  server.close(() => {
    console.log(`[${formatTimestamp()}] 服务器已关闭`);
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log(`[${formatTimestamp()}] 接收到SIGINT信号，准备关闭`);
  await closeAllConnections();
  process.exit(0);
});

// 启动服务器
const port = process.env.PORT || 8083;
const server = app.listen(port, () => {
  console.log(`[${formatTimestamp()}] 智能商城 MCP SSE 服务器已启动，地址: http://localhost:${port}`);
  console.log(`- SSE 连接端点: http://localhost:${port}/sse`);
  console.log(`- 消息处理端点: http://localhost:${port}/messages`);
  console.log(`- 健康检查端点: http://localhost:${port}/health`);
}); 