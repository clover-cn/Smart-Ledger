import { TransactionData, Transaction } from '../types/transaction.js';
import { StorageService } from './storage-service.js';
import { ApiStorageService } from './api-storage-service.js';
import { generateTransactionId, isValidAmount } from '../utils/id-generator.js';
import { getSmartCategory } from '../utils/smart-categorizer.js';
import { formatTimestamp } from '../utils/Common.js';
import { parseRelativeDate } from '../utils/date-parser.js';
import { config } from '../config.js';

/**
 * 存储服务接口，支持文件存储和API存储
 */
interface IStorageService {
  save(transaction: Transaction): Promise<void>;
  saveBatch(transactions: Transaction[]): Promise<void>;
  getAll(): Promise<Transaction[]>;
  clear(): Promise<void>;
}

/**
 * TransactionService - 交易业务逻辑服务
 * 负责处理交易数据的验证、转换和存储
 */
export class TransactionService {
  private storageService: IStorageService;

  constructor(storageService?: IStorageService) {
    if (storageService) {
      this.storageService = storageService;
    } else {
      // 根据配置选择存储服务
      if (config.storage.mode === 'api') {
        console.log('使用API存储模式');
        this.storageService = new ApiStorageService();
      } else {
        console.log('使用文件存储模式');
        this.storageService = new StorageService(config.storage.dbPath);
      }
    }
  }

  /**
   * 记录一笔交易
   * @param data 调用方提供的交易数据
   * @returns 完整的交易记录对象
   */
  async recordTransaction(data: TransactionData): Promise<Transaction> {
    // 验证输入数据
    this.validateTransactionData(data);

    // 处理时间戳 - 支持相对时间解析
    let timestamp: string;
    
    // 尝试从描述中解析相对时间
    const parseResult = parseRelativeDate(data.description);
    if (parseResult.found && parseResult.timestamp) {
      timestamp = parseResult.timestamp;
      console.log(`检测到相对时间: "${parseResult.keyword}" -> ${timestamp}`);
    } else {
      timestamp = formatTimestamp();
    }

    // 构建完整的Transaction对象
    const transaction: Transaction = {
      id: generateTransactionId(),
      type: data.type,
      amount: data.amount,
      category: data.category || getSmartCategory(data.description, data.type),
      description: data.description,
      tags: data.tags || [],
      timestamp: timestamp
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
   * 批量记录多笔交易
   * @param dataList 调用方提供的交易数据数组
   * @returns 完整的交易记录对象数组
   */
  async recordTransactionBatch(dataList: TransactionData[]): Promise<Transaction[]> {
    if (!dataList || dataList.length === 0) {
      throw new Error('交易数据列表不能为空');
    }

    // 验证所有输入数据
    dataList.forEach((data, index) => {
      try {
        this.validateTransactionData(data);
      } catch (error) {
        throw new Error(`第${index + 1}笔交易数据无效: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    });

    // 构建完整的Transaction对象数组
    const transactions: Transaction[] = dataList.map(data => {
      // 处理时间戳 - 支持相对时间解析
      let timestamp: string;
      
      // 尝试从描述中解析相对时间
      const parseResult = parseRelativeDate(data.description);
      if (parseResult.found && parseResult.timestamp) {
        timestamp = parseResult.timestamp;
        console.log(`检测到相对时间: "${parseResult.keyword}" -> ${timestamp}`);
      } else {
        timestamp = formatTimestamp();
      }

      return {
        id: generateTransactionId(),
        type: data.type,
        amount: data.amount,
        category: data.category || getSmartCategory(data.description, data.type),
        description: data.description,
        tags: data.tags || [],
        timestamp: timestamp
      };
    });

    try {
      // 批量保存到存储服务
      await this.storageService.saveBatch(transactions);
      
      console.log(`批量记录 ${transactions.length} 笔交易成功`);
      transactions.forEach(t => {
        console.log(`- ${t.type} ¥${t.amount} - ${t.category}`);
      });
      
      return transactions;
    } catch (error) {
      console.error('批量记录交易时发生错误:', error);
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
   * 获取当天的交易记录
   * @returns 当天的交易记录
   */
  async getTodayTransactions(): Promise<Transaction[]> {
    try {
      const allTransactions = await this.getAllTransactions();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // 筛选当天的交易记录
      const todayTransactions = allTransactions.filter(tx => {
        // 解析时间戳 格式：YYYY-MM-DD HH:mm:ss
        const txDate = new Date(tx.timestamp);
        return txDate >= todayStart && txDate < todayEnd;
      });
      
      // 按时间倒序排列（最新的在前面）
      return todayTransactions.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('获取当天交易记录时发生错误:', error);
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

  /**
   * 检查是否存在重复或相似的交易记录
   * @param data 要检查的交易数据
   * @param hoursBack 检查时间窗口（小时），默认24小时
   * @returns 相似交易记录和检测结果
   */
  async checkDuplicateTransaction(data: TransactionData, hoursBack: number = 24): Promise<{
    hasSimilar: boolean;
    similarTransactions: Array<Transaction & { similarity: number }>;
    suggestion: string;
  }> {
    try {
      const allTransactions = await this.getAllTransactions();
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // 过滤时间窗口内的交易
      const recentTransactions = allTransactions.filter(tx => {
        try {
          // 将字符串时间戳转换为 Date 对象进行比较
          const txDate = new Date(tx.timestamp);
          if (isNaN(txDate.getTime())) {
            console.warn(`交易 ${tx.id} 的时间戳无效: ${tx.timestamp}`);
            return false; // 无效时间戳的交易不参与比较
          }
          return txDate >= cutoffTime;
        } catch (error) {
          console.warn(`处理交易 ${tx.id} 时间戳时出错:`, error);
          return false;
        }
      });

      // 查找相似交易
      const similarTransactions = recentTransactions
        .map(tx => ({
          ...tx,
          similarity: this.calculateSimilarity(tx, data)
        }))
        .filter(tx => tx.similarity > 0.5) // 相似度阈值
        .sort((a, b) => b.similarity - a.similarity); // 按相似度降序排列
      
      const hasSimilar = similarTransactions.length > 0;
      let suggestion = '';
      
      if (hasSimilar) {
        const highSimilarity = similarTransactions.filter(tx => tx.similarity >= 0.8);
        const mediumSimilarity = similarTransactions.filter(tx => tx.similarity >= 0.6 && tx.similarity < 0.8);
        
        if (highSimilarity.length > 0) {
          suggestion = `发现 ${highSimilarity.length} 条高度相似的交易记录，强烈建议确认是否重复添加`;
        } else if (mediumSimilarity.length > 0) {
          suggestion = `发现 ${mediumSimilarity.length} 条可能相似的交易记录，建议确认是否重复添加`;
        } else {
          suggestion = `发现 ${similarTransactions.length} 条疑似相似的交易记录，请确认是否重复添加`;
        }
      } else {
        suggestion = '未发现相似交易记录，可以安全添加';
      }
      
      return {
        hasSimilar,
        similarTransactions,
        suggestion
      };
    } catch (error) {
      console.error('检查重复交易时发生错误:', error);
      throw error;
    }
  }

  /**
   * 计算两个交易的相似度
   * @param existingTx 已存在的交易
   * @param newData 新交易数据
   * @returns 相似度分数 (0-1)
   */
  private calculateSimilarity(existingTx: Transaction, newData: TransactionData): number {
    let similarity = 0;
    let totalWeight = 0;
    
    // 1. 交易类型匹配 (权重: 0.2)
    const typeWeight = 0.2;
    if (existingTx.type === newData.type) {
      similarity += typeWeight;
    }
    totalWeight += typeWeight;
    
    // 2. 金额匹配 (权重: 0.3)
    const amountWeight = 0.3;
    if (Math.abs(existingTx.amount - newData.amount) < 0.01) {
      similarity += amountWeight; // 完全匹配
    } else {
      // 金额相近度计算
      const amountDiff = Math.abs(existingTx.amount - newData.amount);
      const avgAmount = (existingTx.amount + newData.amount) / 2;
      const amountSimilarity = Math.max(0, 1 - (amountDiff / avgAmount));
      if (amountSimilarity > 0.8) { // 金额相差不超过20%
        similarity += amountWeight * amountSimilarity;
      }
    }
    totalWeight += amountWeight;
    
    // 3. 描述相似度 (权重: 0.3)
    const descriptionWeight = 0.3;
    const descriptionSimilarity = this.calculateDescriptionSimilarity(
      existingTx.description,
      newData.description
    );
    similarity += descriptionWeight * descriptionSimilarity;
    totalWeight += descriptionWeight;
    
    // 4. 类别匹配 (权重: 0.2)
    const categoryWeight = 0.2;
    const newCategory = newData.category || getSmartCategory(newData.description, newData.type);
    if (existingTx.category === newCategory) {
      similarity += categoryWeight;
    }
    totalWeight += categoryWeight;
    
    return similarity / totalWeight;
  }

  /**
   * 计算描述文本的相似度
   * @param desc1 描述1
   * @param desc2 描述2
   * @returns 相似度分数 (0-1)
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    // 转换为小写并分词
    const words1 = desc1.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    const words2 = desc2.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    // 计算交集
    const commonWords = words1.filter(word => words2.includes(word));
    
    // Jaccard相似度：交集 / 并集
    const unionSize = new Set([...words1, ...words2]).size;
    const jaccardSimilarity = commonWords.length / unionSize;
    
    // 考虑词序的相似度
    const sequenceSimilarity = this.calculateSequenceSimilarity(words1, words2);
    
    // 综合相似度
    return (jaccardSimilarity * 0.7 + sequenceSimilarity * 0.3);
  }

  /**
   * 计算词序相似度（简化版编辑距离）
   * @param words1 词组1
   * @param words2 词组2
   * @returns 相似度分数 (0-1)
   */
  private calculateSequenceSimilarity(words1: string[], words2: string[]): number {
    const maxLen = Math.max(words1.length, words2.length);
    if (maxLen === 0) return 1;
    
    // 简化的编辑距离计算
    let matches = 0;
    const minLen = Math.min(words1.length, words2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (words1[i] === words2[i]) {
        matches++;
      }
    }
    
    return matches / maxLen;
  }
}