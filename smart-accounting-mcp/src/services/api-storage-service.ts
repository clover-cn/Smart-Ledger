import { Transaction } from "../types/transaction.js";
import { config } from "../config.js";
import { CredentialManager } from "./credential-manager.js";

/**
 * ApiStorageService - 基于API的数据存储服务
 * 将数据存储到远程服务器而不是本地文件
 */
export class ApiStorageService {
  private baseUrl: string;
  private timeout: number;
  private credentialManager: CredentialManager;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.credentialManager = CredentialManager.getInstance();

    if (!this.baseUrl) {
      throw new Error("API_BASE_URL 未配置");
    }
  }

  /**
   * 获取当前用户凭据
   */
  private getCurrentCredentials(): { token: string; userId: string } {
    const token = this.credentialManager.getApiToken();
    const userId = this.credentialManager.getUserId();

    if (!token || !userId) {
      throw new Error("用户凭据未配置，请先使用 setUserCredentials 工具设置用户ID和API令牌");
    }

    return { token, userId };
  }

  /**
   * 创建请求headers
   */
  private getHeaders(): Record<string, string> {
    const { token } = this.getCurrentCredentials();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error || "Unknown error"}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
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
      transaction_date: transaction.timestamp.split(" ")[0], // 从 "YYYY-MM-DD HH:mm:ss" 提取日期部分
    };
  }

  /**
   * 将API响应转换为Transaction格式
   */
  private convertFromApiFormat(apiTransaction: any): Transaction {
    // 处理时间戳，确保格式正确
    let timestamp: string;
    try {
      // 优先使用 transaction_date，如果没有则使用 created_at
      if (apiTransaction.transaction_date) {
        // 如果有具体的交易日期，使用它
        const date = new Date(apiTransaction.transaction_date);
        if (isNaN(date.getTime())) {
          // 如果 transaction_date 无效，尝试使用 created_at
          const createdDate = new Date(apiTransaction.created_at);
          timestamp = isNaN(createdDate.getTime()) ? new Date().toISOString() : createdDate.toISOString();
        } else {
          timestamp = date.toISOString();
        }
      } else if (apiTransaction.created_at) {
        const createdDate = new Date(apiTransaction.created_at);
        timestamp = isNaN(createdDate.getTime()) ? new Date().toISOString() : createdDate.toISOString();
      } else {
        // 如果都没有，使用当前时间
        timestamp = new Date().toISOString();
      }
    } catch (error) {
      console.warn("时间戳解析失败，使用当前时间:", error);
      timestamp = new Date().toISOString();
    }

    return {
      id: apiTransaction.id,
      type: apiTransaction.type,
      amount: apiTransaction.amount,
      category: apiTransaction.category,
      description: apiTransaction.description || "",
      tags: apiTransaction.tags || [],
      timestamp,
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
        method: "POST",
        body: JSON.stringify(apiData),
      });

      if (!response.success) {
        throw new Error(response.error || "保存失败");
      }

      console.log(`交易记录已保存到API: ${transaction.id}`);
    } catch (error) {
      console.error("API保存交易记录时发生错误:", error);
      throw new Error(`无法保存交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 批量保存多笔交易记录
   * @param transactions 要保存的交易记录数组
   */
  async saveBatch(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    try {
      const apiDataList = transactions.map((tx) => this.convertToApiFormat(tx));
      const url = `${this.baseUrl}/transactions/batch`;

      console.log(`正在批量保存 ${transactions.length} 笔交易记录到API`);
      const response = await this.request(url, {
        method: "POST",
        body: JSON.stringify({
          transactions: apiDataList,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "批量保存失败");
      }

      console.log(`批量保存 ${transactions.length} 笔交易记录成功`);
    } catch (error) {
      console.error("API批量保存交易记录时发生错误:", error);
      throw new Error(`无法批量保存交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 读取所有交易记录
   * @returns 所有交易记录的数组
   */
  async getAll(): Promise<Transaction[]> {
    try {
      // 服务器限制每次最多获取100条记录，需要分页获取
      let allTransactions: Transaction[] = [];
      let page = 1;
      const limit = 100; // 服务器允许的最大限制
      let hasMore = true;

      while (hasMore) {
        const url = `${this.baseUrl}/transactions?page=${page}&limit=${limit}`;

        console.log(`正在从API获取交易记录 (第${page}页): ${url}`);
        const response = await this.request(url);

        if (!response.success) {
          throw new Error(response.error || "获取数据失败");
        }

        const transactions = response.data.map((apiTx: any) => this.convertFromApiFormat(apiTx));

        allTransactions = allTransactions.concat(transactions);

        // 如果返回的记录数少于限制数，说明已经是最后一页
        hasMore = transactions.length === limit;
        page++;

        // 为了防止无限循环，设置最大页数限制
        if (page > 100) {
          // 最多获取10000条记录
          console.warn("达到最大页数限制，停止获取更多记录");
          break;
        }
      }

      console.log(`从API获取到 ${allTransactions.length} 笔交易记录`);
      return allTransactions;
    } catch (error) {
      console.error("从API读取交易记录时发生错误:", error);
      throw new Error(`无法读取交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 根据日期范围获取交易记录
   * @param startDate 开始日期 (YYYY-MM-DD 格式)
   * @param endDate 结束日期 (YYYY-MM-DD 格式，可选，默认等于 startDate)
   * @param page 页码，默认1
   * @param limit 每页数量，默认100
   * @returns 指定日期范围内的交易记录
   */
  async getByDateRange(
    startDate: string,
    endDate?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<Transaction[]> {
    try {
      // 如果没有提供结束日期，使用开始日期
      const actualEndDate = endDate || startDate;
      
      // 构建查询参数
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: actualEndDate,
        page: page.toString(),
        limit: limit.toString()
      });

      const url = `${this.baseUrl}/transactions?${params.toString()}`;
      
      console.log(`正在从API获取日期范围交易记录: ${startDate} ~ ${actualEndDate}`);
      const response = await this.request(url);

      if (!response.success) {
        throw new Error(response.error || "获取数据失败");
      }

      const transactions = response.data.map((apiTx: any) => this.convertFromApiFormat(apiTx));

      console.log(`获取到 ${transactions.length} 笔交易记录 (${startDate} ~ ${actualEndDate})`);
      return transactions;
    } catch (error) {
      console.error("从API获取日期范围交易记录时发生错误:", error);
      throw new Error(`无法获取日期范围交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 获取今天的交易记录
   * @returns 今天的交易记录
   */
  async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
    return await this.getByDateRange(today);
  }

  /**
   * 删除指定的交易记录
   * @param transactionId 要删除的交易记录ID
   */
  async delete(transactionId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}`;

      console.log(`正在删除交易记录: ${transactionId}`);
      const response = await this.request(url, {
        method: "DELETE",
      });

      if (!response.success) {
        throw new Error(response.error || "删除失败");
      }

      console.log(`交易记录已删除: ${transactionId}`);
    } catch (error) {
      console.error("API删除交易记录时发生错误:", error);
      throw new Error(`无法删除交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 批量删除多笔交易记录
   * @param transactionIds 要删除的交易记录ID数组
   */
  async deleteBatch(transactionIds: string[]): Promise<void> {
    if (transactionIds.length === 0) return;

    try {
      const url = `${this.baseUrl}/transactions/batch`;

      console.log(`正在批量删除 ${transactionIds.length} 笔交易记录`);
      const response = await this.request(url, {
        method: "DELETE",
        body: JSON.stringify({
          ids: transactionIds,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "批量删除失败");
      }

      console.log(`批量删除 ${transactionIds.length} 笔交易记录成功`);
    } catch (error) {
      console.error("API批量删除交易记录时发生错误:", error);
      throw new Error(`无法批量删除交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 更新指定的交易记录
   * @param transactionId 要更新的交易记录ID
   * @param updateData 要更新的交易数据（部分字段）
   */
  async update(transactionId: string, updateData: Partial<Transaction>): Promise<void> {
    try {
      const url = `${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}`;

      // 只传递需要更新的字段，转换为API格式
      const apiUpdateData: any = {};
      
      if (updateData.type !== undefined) {
        apiUpdateData.type = updateData.type;
      }
      
      if (updateData.amount !== undefined) {
        apiUpdateData.amount = updateData.amount;
      }
      
      if (updateData.category !== undefined) {
        apiUpdateData.category = updateData.category;
      }
      
      if (updateData.description !== undefined) {
        apiUpdateData.description = updateData.description;
      }
      
      if (updateData.tags !== undefined) {
        apiUpdateData.tags = updateData.tags;
      }
      
      if (updateData.timestamp !== undefined) {
        apiUpdateData.transaction_date = updateData.timestamp.split(" ")[0]; // 从时间戳提取日期部分
      }

      console.log(`正在更新交易记录: ${transactionId}`);
      const response = await this.request(url, {
        method: "PUT",
        body: JSON.stringify(apiUpdateData),
      });

      if (!response.success) {
        throw new Error(response.error || "更新失败");
      }

      console.log(`交易记录已更新: ${transactionId}`);
    } catch (error) {
      console.error("API更新交易记录时发生错误:", error);
      throw new Error(`无法更新交易记录: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 清空所有交易记录（仅用于测试，实际API可能不提供此功能）
   */
  async clear(): Promise<void> {
    console.warn("API模式下不支持清空所有交易记录");
    throw new Error("API模式下不支持清空操作");
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
      console.error("API连接验证失败:", error);
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
        throw new Error(response.error || "获取用户信息失败");
      }

      return response.data;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }
  }
}
