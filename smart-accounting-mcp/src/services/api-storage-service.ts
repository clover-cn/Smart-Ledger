import { Transaction } from '../types/transaction.js';
import { config } from '../config.js';

/**
 * ApiStorageService - 基于API的数据存储服务
 * 将数据存储到远程服务器而不是本地文件
 */
export class ApiStorageService {
  private baseUrl: string;
  private token: string;
  private userId: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.token = config.api.token;
    this.userId = config.api.userId;
    this.timeout = config.api.timeout;

    if (!this.baseUrl) {
      throw new Error('API_BASE_URL 未配置');
    }
    if (!this.token) {
      throw new Error('API_TOKEN 未配置，请先登录获取token');
    }
    if (!this.userId) {
      throw new Error('USER_ID 未配置，请先登录获取用户ID');
    }
  }

  /**
   * 创建请求headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * 发送HTTP请求的通用方法
   */
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`API请求超时 (${this.timeout}ms)`);
      }
      throw error;
    }
  }

  /**
   * 将TransactionData转换为API格式
   */
  private convertToApiFormat(transaction: Transaction): any {
    return {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      tags: transaction.tags,
      transaction_date: transaction.timestamp.split(' ')[0] // 从 "YYYY-MM-DD HH:mm:ss" 提取日期部分
    };
  }

  /**
   * 将API响应转换为Transaction格式
   */
  private convertFromApiFormat(apiTransaction: any): Transaction {
    return {
      id: apiTransaction.id,
      type: apiTransaction.type,
      amount: apiTransaction.amount,
      category: apiTransaction.category,
      description: apiTransaction.description || '',
      tags: apiTransaction.tags || [],
      timestamp: `${apiTransaction.transaction_date} ${new Date(apiTransaction.created_at).toTimeString().split(' ')[0]}`
    };
  }

  /**
   * 保存单个交易记录
   * @param transaction 要保存的交易记录
   */
  async save(transaction: Transaction): Promise<void> {
    try {
      const apiData = this.convertToApiFormat(transaction);
      const url = `${this.baseUrl}/transactions`;
      
      console.log(`正在保存交易记录到API: ${url}`);
      const response = await this.request(url, {
        method: 'POST',
        body: JSON.stringify(apiData)
      });

      if (!response.success) {
        throw new Error(response.error || '保存失败');
      }

      console.log(`交易记录已保存到API: ${transaction.id}`);
    } catch (error) {
      console.error('API保存交易记录时发生错误:', error);
      throw new Error(`无法保存交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量保存多笔交易记录
   * @param transactions 要保存的交易记录数组
   */
  async saveBatch(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;
    
    try {
      const apiDataList = transactions.map(tx => this.convertToApiFormat(tx));
      const url = `${this.baseUrl}/transactions/batch`;
      
      console.log(`正在批量保存 ${transactions.length} 笔交易记录到API`);
      const response = await this.request(url, {
        method: 'POST',
        body: JSON.stringify({
          transactions: apiDataList
        })
      });

      if (!response.success) {
        throw new Error(response.error || '批量保存失败');
      }

      console.log(`批量保存 ${transactions.length} 笔交易记录成功`);
    } catch (error) {
      console.error('API批量保存交易记录时发生错误:', error);
      throw new Error(`无法批量保存交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 读取所有交易记录
   * @returns 所有交易记录的数组
   */
  async getAll(): Promise<Transaction[]> {
    try {
      const url = `${this.baseUrl}/transactions?limit=1000`; // 获取最近1000条记录
      
      console.log(`正在从API获取交易记录: ${url}`);
      const response = await this.request(url);

      if (!response.success) {
        throw new Error(response.error || '获取数据失败');
      }

      const transactions = response.data.map((apiTx: any) => 
        this.convertFromApiFormat(apiTx)
      );

      console.log(`从API获取到 ${transactions.length} 笔交易记录`);
      return transactions;
    } catch (error) {
      console.error('从API读取交易记录时发生错误:', error);
      throw new Error(`无法读取交易记录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清空所有交易记录（仅用于测试，实际API可能不提供此功能）
   */
  async clear(): Promise<void> {
    console.warn('API模式下不支持清空所有交易记录');
    throw new Error('API模式下不支持清空操作');
  }

  /**
   * 验证API连接和用户认证
   */
  async validateConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/auth/verify`;
      const response = await this.request(url);
      
      return response.success && response.data?.valid;
    } catch (error) {
      console.error('API连接验证失败:', error);
      return false;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/auth/profile`;
      const response = await this.request(url);
      
      if (!response.success) {
        throw new Error(response.error || '获取用户信息失败');
      }
      
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
}