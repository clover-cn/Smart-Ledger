import { promises as fs } from 'fs';
import { Transaction } from '../types/transaction.js';
/**
 * StorageService - 数据持久化服务
 * 负责将交易记录保存到JSON文件并读取
 */
export class StorageService {
  private dbPath: string;
  private lockFile: string;
  private isWriting: boolean = false;
  private writeQueue: Array<() => Promise<void>> = [];

  constructor(dbPath: string = 'db.json') {
    this.dbPath = dbPath;
    this.lockFile = `${dbPath}.lock`;
  }

  /**
   * 获取文件锁，防止并发写入
   */
  private async acquireLock(): Promise<void> {
    const maxRetries = 50;
    const retryDelay = 100;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // 尝试创建锁文件
        await fs.writeFile(this.lockFile, process.pid.toString(), { flag: 'wx' });
        return;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // 锁文件已存在，等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('无法获取文件锁，操作超时');
  }

  /**
   * 释放文件锁
   */
  private async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFile);
    } catch (error: any) {
      // 忽略锁文件不存在的错误
      if (error.code !== 'ENOENT') {
        console.warn('释放文件锁时发生警告:', error);
      }
    }
  }

  /**
   * 将交易记录追加到JSON文件中（带锁保护）
   * @param transaction 要保存的交易记录
   */
  async save(transaction: Transaction): Promise<void> {
    return new Promise((resolve, reject) => {
      // 将操作加入队列
      this.writeQueue.push(async () => {
        await this.acquireLock();
        try {
          // 读取现有数据
          const existingTransactions = await this.getAll();
          
          // 添加新交易记录
          existingTransactions.push(transaction);
          
          // 将数据序列化并写入文件
          const jsonData = JSON.stringify(existingTransactions, null, 2);
          await fs.writeFile(this.dbPath, jsonData, 'utf-8');
          
          console.log(`交易记录已保存: ${transaction.id}`);
          resolve();
        } catch (error) {
          console.error('保存交易记录时发生错误:', error);
          reject(new Error(`无法保存交易记录: ${error instanceof Error ? error.message : '未知错误'}`));
        } finally {
          await this.releaseLock();
        }
      });
      
      // 处理队列
      this.processWriteQueue();
    });
  }

  /**
   * 批量保存多笔交易记录
   * @param transactions 要保存的交易记录数组
   */
  async saveBatch(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;
    
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        await this.acquireLock();
        try {
          // 读取现有数据
          const existingTransactions = await this.getAll();
          
          // 添加所有新交易记录
          existingTransactions.push(...transactions);
          
          // 将数据序列化并写入文件
          const jsonData = JSON.stringify(existingTransactions, null, 2);
          await fs.writeFile(this.dbPath, jsonData, 'utf-8');
          
          console.log(`批量保存 ${transactions.length} 笔交易记录成功`);
          resolve();
        } catch (error) {
          console.error('批量保存交易记录时发生错误:', error);
          reject(new Error(`无法批量保存交易记录: ${error instanceof Error ? error.message : '未知错误'}`));
        } finally {
          await this.releaseLock();
        }
      });
      
      // 处理队列
      this.processWriteQueue();
    });
  }

  /**
   * 处理写入队列，确保串行执行
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }
    
    this.isWriting = true;
    
    while (this.writeQueue.length > 0) {
      const operation = this.writeQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('写入队列操作失败:', error);
        }
      }
    }
    
    this.isWriting = false;
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

      // 直接返回交易记录，时间戳已经是格式化的字符串
      return transactions;

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