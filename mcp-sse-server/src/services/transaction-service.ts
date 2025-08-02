import { TransactionData, Transaction } from '../types/transaction.js';
import { StorageService } from './storage-service.js';
import { generateTransactionId, isValidAmount } from '../utils/id-generator.js';
import { getSmartCategory } from '../utils/smart-categorizer.js';

/**
 * TransactionService - 交易业务逻辑服务
 * 负责处理交易数据的验证、转换和存储
 */
export class TransactionService {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * 记录一笔交易
   * @param data 调用方提供的交易数据
   * @returns 完整的交易记录对象
   */
  async recordTransaction(data: TransactionData): Promise<Transaction> {
    // 验证输入数据
    this.validateTransactionData(data);

    // 构建完整的Transaction对象
    const transaction: Transaction = {
      id: generateTransactionId(),
      type: data.type,
      amount: data.amount,
      category: data.category || getSmartCategory(data.description, data.type),
      description: data.description,
      tags: data.tags || [],
      timestamp: new Date()
    };

    try {
      // 保存到存储服务
      await this.storageService.save(transaction);
      
      console.log(`交易记录成功: ${transaction.type} ¥${transaction.amount} - ${transaction.category}`);
      
      return transaction;
    } catch (error) {
      console.error('记录交易时发生错误:', error);
      throw error; // 重新抛出存储错误
    }
  }

  /**
   * 验证交易数据的有效性
   * @param data 要验证的交易数据
   * @throws 如果数据无效则抛出错误
   */
  private validateTransactionData(data: TransactionData): void {
    // 验证交易类型
    if (!data.type) {
      throw new Error('交易类型是必需的');
    }

    if (data.type !== 'income' && data.type !== 'expense') {
      throw new Error('交易类型必须是 income 或 expense');
    }

    // 验证金额
    if (data.amount === undefined || data.amount === null) {
      throw new Error('金额是必需的且必须大于0');
    }

    if (!isValidAmount(data.amount)) {
      throw new Error('金额是必需的且必须大于0');
    }

    // 验证描述信息
    if (!data.description || data.description.trim() === '') {
      throw new Error('描述信息是必需的');
    }
  }

  /**
   * 获取所有交易记录
   * @returns 所有交易记录
   */
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.storageService.getAll();
    } catch (error) {
      console.error('获取交易记录时发生错误:', error);
      throw error;
    }
  }

  /**
   * 按类型获取交易记录统计
   * @returns 收入和支出的统计信息
   */
  async getTransactionSummary(): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await this.getAllTransactions();
      
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount;
        } else {
          totalExpense += transaction.amount;
        }
      });

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error('获取交易统计时发生错误:', error);
      throw error;
    }
  }
}