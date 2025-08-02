// 智能记账系统的数据类型定义

/**
 * MCP 输入数据 - 调用方（LLM）提供给MCP的数据结构
 */
export interface TransactionData {
  /** 交易类型：收入或支出 */
  type: 'income' | 'expense';
  /** 金额 */
  amount: number;
  /** 类别（可选）*/
  category?: string;
  /** 原始用户输入，用于存档 */
  description: string;
  /** 标签（可选），例如 ['reimbursement'] */
  tags?: string[];
}

/**
 * Transaction - 内部存储模型，实际存储在数据库中的数据结构
 */
export interface Transaction {
  /** 唯一ID，由系统生成 */
  id: string;
  /** 交易类型：收入或支出 */
  type: 'income' | 'expense';
  /** 金额 */
  amount: number;
  /** 类别，经过处理，一定有值 */
  category: string;
  /** 原始用户输入，用于存档 */
  description: string;
  /** 标签 */
  tags: string[];
  /** 记录时间，由系统生成，格式化为本地时间字符串 */
  timestamp: string;
}