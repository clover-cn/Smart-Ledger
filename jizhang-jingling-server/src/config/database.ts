import { createPool, Pool } from 'mysql2/promise';
import { config } from './index.js';

// 数据库连接池配置
const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // 字符集
  charset: 'utf8mb4',
  
  // 连接超时配置
  acquireTimeout: 60000,  // 获取连接超时时间（60秒）
  timeout: 60000,         // 查询超时时间（60秒）
  connectTimeout: 30000,  // 连接超时时间（30秒）
  
  // 空闲连接配置
  idleTimeout: 300000,    // 空闲连接超时（5分钟）
  
  // 其他配置
  multipleStatements: false,
  dateStrings: false,
  
  // 连接选项
  typeCast: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  
  // 启用keep alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建数据库连接池
export const pool: Pool = createPool(poolConfig);

// 测试数据库连接（带重试机制）
export async function testConnection(retries: number = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      await connection.ping(); // 发送ping确保连接活跃
      console.log('✅ 数据库连接成功');
      connection.release();
      return true;
    } catch (error: any) {
      console.error(`❌ 数据库连接失败 (尝试 ${i + 1}/${retries}):`, error.message);
      
      if (i === retries - 1) {
        console.error('数据库连接重试次数用尽');
        return false;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
}

// 健康检查函数
export async function healthCheck(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as health_check');
    connection.release();
    
    return { healthy: true };
  } catch (error: any) {
    console.error('数据库健康检查失败:', error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

// 执行带重试的数据库操作
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`数据库操作失败 (尝试 ${i + 1}/${retries + 1}):`, error.message);
      
      // 如果是连接重置错误，进行重试
      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        if (i < retries) {
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
          continue;
        }
      }
      
      throw error;
    }
  }
  throw new Error('数据库操作重试次数用尽');
}

// 初始化数据库（创建表）
export async function initializeDatabase() {
  try {
    // 检查连接
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    
    // 确保基础表存在
    await createTablesIfNotExist();
    
    console.log('✅ 数据库初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return false;
  }
}

// 创建表（如果不存在）
async function createTablesIfNotExist() {
  const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_created_at (created_at)
    )
  `;

  const createTransactionTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('income', 'expense') NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      tags JSON,
      transaction_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_category (category),
      INDEX idx_transaction_date (transaction_date),
      INDEX idx_created_at (created_at),
      INDEX idx_user_date (user_id, transaction_date)
    )
  `;

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      name VARCHAR(100) NOT NULL,
      type ENUM('income', 'expense') NOT NULL,
      icon VARCHAR(50),
      color VARCHAR(7),
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_name (name),
      UNIQUE KEY unique_user_category (user_id, name, type)
    )
  `;

  console.log('🔄 正在创建数据库表...');
  
  // 创建用户表
  await executeWithRetry(async () => {
    await pool.execute(createUserTable);
  });
  console.log('✅ 用户表已创建/确认存在');

  // 创建交易表
  await executeWithRetry(async () => {
    await pool.execute(createTransactionTable);
  });
  console.log('✅ 交易表已创建/确认存在');

  // 创建分类表
  await executeWithRetry(async () => {
    await pool.execute(createCategoriesTable);
  });
  console.log('✅ 分类表已创建/确认存在');

  // 插入默认分类（如果不存在）
  await insertDefaultCategories();
}

// 插入默认分类
async function insertDefaultCategories() {
  try {
    const [rows] = await executeWithRetry(async () => {
      return await pool.execute('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL');
    });
    
    const count = (rows as any[])[0].count;
    if (count > 0) {
      console.log('✅ 默认分类已存在，跳过插入');
      return;
    }

    console.log('🔄 正在插入默认分类...');

    const defaultCategories = [
      // 支出分类
      ['cat_food', null, '餐饮', 'expense', '🍽️', '#FF6B6B', 1],
      ['cat_entertainment', null, '休闲娱乐', 'expense', '🎬', '#96CEB4', 2],
      ['cat_shopping', null, '购物', 'expense', '🛒', '#45B7D1', 3],
      ['cat_beauty', null, '穿搭美容', 'expense', '💄', '#E91E63', 4],
      ['cat_snacks', null, '水果零食', 'expense', '🍎', '#FFB74D', 5],
      ['cat_transport', null, '交通', 'expense', '🚗', '#4ECDC4', 6],
      ['cat_daily', null, '生活日用', 'expense', '🏠', '#98D8C8', 7],
      ['cat_social', null, '人情社交', 'expense', '👥', '#FFA726', 8],
      ['cat_pet', null, '宠物', 'expense', '🐕', '#8BC34A', 9],
      ['cat_child', null, '养娃', 'expense', '👶', '#FFEB3B', 10],
      ['cat_sports', null, '运动', 'expense', '⚽', '#03DAC5', 11],
      ['cat_services', null, '生活服务', 'expense', '🔧', '#607D8B', 12],
      ['cat_groceries', null, '买菜', 'expense', '🥬', '#4CAF50', 13],
      ['cat_housing', null, '住房', 'expense', '🏡', '#795548', 14],
      ['cat_car', null, '爱车', 'expense', '🚙', '#FF5722', 15],
      ['cat_other_expense', null, '其他', 'expense', '📦', '#BDC3C7', 99],
      
      // 收入分类
      ['cat_salary', null, '工资', 'income', '💰', '#52C41A', 1],
      ['cat_freelance', null, '兼职', 'income', '💼', '#EB2F96', 2],
      ['cat_investment', null, '投资理财', 'income', '📈', '#722ED1', 3],
      ['cat_bonus', null, '奖金补贴', 'income', '🎁', '#1890FF', 4],
      ['cat_refund', null, '退款', 'income', '↩️', '#13C2C2', 5],
      ['cat_other_income', null, '其他', 'income', '💎', '#BDC3C7', 99]
    ];

    for (const category of defaultCategories) {
      await executeWithRetry(async () => {
        return await pool.execute(
          'INSERT INTO categories (id, user_id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
          category
        );
      });
    }

    console.log('✅ 默认分类插入完成');
  } catch (error: any) {
    if (!error.message.includes('Duplicate entry')) {
      console.warn('⚠️ 插入默认分类时出现错误:', error.message);
    }
  }
}

// 优雅关闭连接池
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ 数据库连接池已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接池失败:', error);
  }
}

// 监听进程退出事件，确保连接池正确关闭
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);