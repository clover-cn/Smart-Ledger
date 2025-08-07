export const config = {
  server: {
    port: process.env.PORT || 8083,
    cors: {
      origin: process.env.ALLOWED_ORIGINS || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    token: process.env.API_TOKEN || '',
    userId: process.env.USER_ID || '',
    timeout: parseInt(process.env.API_TIMEOUT || '10000')
  },
  storage: {
    // 存储模式: 'file' | 'api'
    mode: process.env.STORAGE_MODE || 'api',
    // 文件模式下的数据库文件路径
    dbPath: process.env.DB_PATH || 'db.json'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  heartbeat: {
    interval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000')
  }
};