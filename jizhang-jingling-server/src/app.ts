import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/index.js';
import { testConnection, healthCheck, initializeDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// 导入路由
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

// 验证配置
validateConfig();

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    const status = dbHealth.healthy ? 200 : 503;
    
    res.status(status).json({
      success: dbHealth.healthy,
      message: dbHealth.healthy ? '服务运行正常' : '数据库连接异常',
      timestamp: new Date().toISOString(),
      env: config.server.env,
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        error: dbHealth.error || null
      }
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: '服务健康检查失败',
      timestamp: new Date().toISOString(),
      env: config.server.env,
      database: {
        status: 'error',
        error: error.message
      }
    });
  }
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '记账精灵API服务器',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      health: '/health'
    }
  });
});

// 404处理
app.use(notFoundHandler);

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库（包括连接测试和创建表）
    console.log('🔍 正在初始化数据库...');
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ 数据库初始化失败，无法启动服务器');
      console.error('请检查数据库配置和网络连接');
      process.exit(1);
    }

    // 启动定期健康检查
    setInterval(async () => {
      const health = await healthCheck();
      if (!health.healthy) {
        console.warn(`⚠️ 数据库健康检查失败: ${health.error}`);
      }
    }, 30000); // 每30秒检查一次

    // 启动HTTP服务器
    const server = app.listen(config.server.port, () => {
      console.log(`
🚀 记账精灵服务器启动成功！

📍 服务器地址: http://localhost:${config.server.port}
🌍 环境: ${config.server.env}
📊 数据库: ${config.db.host}:${config.db.port}/${config.db.database}

📚 API文档:
  - GET  /health              - 健康检查
  - POST /api/auth/register   - 用户注册  
  - POST /api/auth/login      - 用户登录
  - GET  /api/auth/profile    - 获取用户信息
  - GET  /api/transactions    - 获取交易记录
  - POST /api/transactions    - 创建交易记录
      `);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('🛑 收到SIGTERM信号，正在优雅关闭...');
      server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 收到SIGINT信号，正在优雅关闭...');
      server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动服务器
// 修复 tsx 运行时的模块检测问题
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const currentFile = fileURLToPath(import.meta.url);
const mainFile = resolve(process.argv[1] || '');

console.log('🔍 调试信息:');
console.log('currentFile:', currentFile);
console.log('mainFile:', mainFile);

const isMainModule = currentFile === mainFile ||
                     process.argv[1]?.endsWith('src/app.ts') ||
                     process.argv[1]?.endsWith('src\\app.ts');

console.log('isMainModule:', isMainModule);

if (isMainModule) {
  console.log('✅ 条件匹配，正在启动服务器...');
  startServer();
} else {
  console.log('❌ 条件不匹配，服务器未启动');
}

export default app;