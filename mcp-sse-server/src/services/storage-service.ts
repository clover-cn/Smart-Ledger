import { promises as fs } from 'fs';
import { Transaction } from '../types/transaction.js';

/**
 * StorageService - 数据持久化服务
 * 负责将交易记录保存到JSON文件并读取
 */
export class StorageService {
  private dbPath: string;

  constructor(dbPath: string = 'db.json') {
    this.dbPath = dbPath;
  }

  /**
   * 将交易记录追加到JSON文件中
   * @param transaction 要保存的交易记录
   */
  async save(transaction: Transaction): Promise<void> {
    try {
      // 读取现有数据
      const existingTransactions = await this.getAll();
      
      // 添加新交易记录
      existingTransactions.push(transaction);
      
      // 将数据序列化并写入文件
      const jsonData = JSON.stringify(existingTransactions, null, 2);
      await fs.writeFile(this.dbPath, jsonData, 'utf-8');
      
      console.log(`交易记录已保存: ${transaction.id}`);
    } catch (error) {
      console.error('保存交易记录时发生错误:', error);
      throw new Error(`无法保存交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 读取所有交易记录
   * @returns 所有交易记录的数组
   */
  async getAll(): Promise<Transaction[]> {
    try {
      // 检查文件是否存在
      try {
        await fs.access(this.dbPath);
      } catch {
        // 文件不存在，返回空数组
        return [];
      }

      // 读取文件内容
      const fileContent = await fs.readFile(this.dbPath, 'utf-8');
      
      // 如果文件为空，返回空数组
      if (!fileContent.trim()) {
        return [];
      }

      // 解析JSON数据
      const transactions = JSON.parse(fileContent);
      
      // 确保返回的是数组
      if (!Array.isArray(transactions)) {
        console.warn('数据库文件格式不正确，返回空数组');
        return [];
      }

      // 将时间戳字符串转换回Date对象
      return transactions.map(transaction => ({
        ...transaction,
        timestamp: new Date(transaction.timestamp)
      }));

    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('数据库文件JSON格式错误:', error);
        throw new Error('数据库文件损坏，无法解析JSON格式');
      }
      
      console.error('读取交易记录时发生错误:', error);
      throw new Error(`无法读取交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清空所有交易记录（主要用于测试）
   */
  async clear(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, '[]', 'utf-8');
      console.log('所有交易记录已清空');
    } catch (error) {
      console.error('清空交易记录时发生错误:', error);
      throw new Error(`无法清空交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}