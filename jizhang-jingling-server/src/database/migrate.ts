import { pool } from '../config/database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 开始数据库迁移...');
    
    // 读取SQL文件
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // 改进的SQL分割：处理多行语句和注释
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // 过滤空语句和纯注释行
        if (stmt.length === 0) return false;
        if (stmt.startsWith('--')) return false;
        // 过滤只包含注释和空行的语句
        const lines = stmt.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      });
    
    console.log(`发现 ${statements.length} 个SQL语句需要执行`);
    
    // 执行每个SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.replace(/\s+/g, ' ').substring(0, 80);
      console.log(`执行第 ${i + 1} 个SQL: ${preview}...`);
      
      try {
        await pool.execute(statement);
        console.log(`✅ 成功执行第 ${i + 1} 个SQL语句`);
      } catch (sqlError: any) {
        console.error(`❌ 执行第 ${i + 1} 个SQL语句失败:`, sqlError.message);
        console.error(`SQL语句: ${statement}`);
        throw sqlError;
      }
    }
    
    console.log('✅ 数据库迁移完成');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  }
}

// 检查表是否存在
async function checkTables() {
  try {
    const [rows] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('users', 'transactions', 'categories', 'user_sessions')
    `, [process.env.DB_NAME]);
    
    return (rows as any[]).map(row => row.TABLE_NAME);
  } catch (error) {
    console.error('检查表失败:', error);
    return [];
  }
}

// 主函数
async function main() {
  try {
    const existingTables = await checkTables();
    console.log('现有表:', existingTables);
    
    if (existingTables.length === 0) {
      console.log('📋 未找到数据表，开始创建...');
      await runMigration();
    } else {
      console.log('📋 数据表已存在，跳过迁移');
      console.log('如需重新创建表，请先手动删除数据库');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('迁移过程出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigration, checkTables };