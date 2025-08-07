import { pool } from '../config/database.js';
import { 
  Transaction, 
  TransactionCreateInput, 
  TransactionUpdateInput, 
  TransactionQuery,
  PaginatedResponse,
  DashboardStats,
  CategoryStats,
  MonthlyStats
} from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TransactionService {
  // 生成唯一交易ID
  private generateTransactionId(): string {
    return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 创建交易记录
  async createTransaction(userId: string, data: TransactionCreateInput): Promise<Transaction> {
    const { type, amount, category, description, tags = [], transaction_date } = data;
    
    // 生成交易ID
    const transactionId = this.generateTransactionId();
    
    // 使用今天的日期作为默认交易日期
    const date = transaction_date || new Date().toISOString().split('T')[0];
    
    // 插入交易记录
    await pool.execute(
      `INSERT INTO transactions (id, user_id, type, amount, category, description, tags, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, type, amount, category, description || '', JSON.stringify(tags), date]
    );

    // 返回创建的交易记录
    return await this.getTransactionById(userId, transactionId);
  }

  // 获取单个交易记录
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction> {
    const [rows] = await pool.execute(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ?`,
      [transactionId, userId]
    );

    const transactions = rows as RowDataPacket[];
    if (transactions.length === 0) {
      throw new Error('交易记录不存在');
    }

    const transaction = transactions[0];
    return {
      ...transaction,
      tags: typeof transaction.tags === 'string' ? JSON.parse(transaction.tags) : transaction.tags,
      amount: parseFloat(transaction.amount)
    } as Transaction;
  }

  // 获取交易记录列表（带分页和过滤）
  async getTransactions(userId: string, query: TransactionQuery): Promise<PaginatedResponse<Transaction>> {
    const {
      type,
      category,
      start_date,
      end_date,
      page = 1,
      limit = 20,
      tags = []
    } = query;

    // 构建查询条件
    const conditions: string[] = ['user_id = ?'];
    const params: any[] = [userId];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (start_date) {
      conditions.push('transaction_date >= ?');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('transaction_date <= ?');
      params.push(end_date);
    }

    if (tags.length > 0) {
      const tagConditions = tags.map(() => 'JSON_CONTAINS(tags, ?)').join(' OR ');
      conditions.push(`(${tagConditions})`);
      tags.forEach(tag => params.push(JSON.stringify(tag)));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM transactions ${whereClause}`,
      params
    );
    const total = (countRows as RowDataPacket[])[0].total;

    // 计算分页参数
    const offset = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // 获取分页数据
    const [dataRows] = await pool.execute(
      `SELECT * FROM transactions ${whereClause} 
       ORDER BY transaction_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const transactions = (dataRows as RowDataPacket[]).map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      amount: parseFloat(row.amount)
    })) as Transaction[];

    return {
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }

  // 更新交易记录
  async updateTransaction(userId: string, transactionId: string, data: TransactionUpdateInput): Promise<Transaction> {
    // 检查交易记录是否存在
    await this.getTransactionById(userId, transactionId);

    const updates: string[] = [];
    const values: any[] = [];

    // 构建更新语句
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'tags') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (updates.length === 0) {
      throw new Error('没有可更新的字段');
    }

    values.push(userId, transactionId);

    // 执行更新
    await pool.execute(
      `UPDATE transactions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND id = ?`,
      values
    );

    // 返回更新后的交易记录
    return await this.getTransactionById(userId, transactionId);
  }

  // 删除交易记录
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    // 检查交易记录是否存在
    await this.getTransactionById(userId, transactionId);

    // 执行删除
    await pool.execute(
      'DELETE FROM transactions WHERE user_id = ? AND id = ?',
      [userId, transactionId]
    );
  }

  // 获取用户dashboard统计数据
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式

    // 获取总余额
    const [balanceRows] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
       FROM transactions WHERE user_id = ?`,
      [userId]
    );
    const balanceData = (balanceRows as RowDataPacket[])[0];
    const total_balance = (balanceData.total_income || 0) - (balanceData.total_expense || 0);

    // 获取本月统计
    const [monthRows] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as month_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as month_expense
       FROM transactions 
       WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [userId, currentMonth]
    );
    const monthData = (monthRows as RowDataPacket[])[0];
    const month_income = monthData.month_income || 0;
    const month_expense = monthData.month_expense || 0;
    const month_balance = month_income - month_expense;

    // 获取最近交易记录
    const [recentRows] = await pool.execute(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY transaction_date DESC, created_at DESC 
       LIMIT 5`,
      [userId]
    );
    const recent_transactions = (recentRows as RowDataPacket[]).map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      amount: parseFloat(row.amount)
    })) as Transaction[];

    // 获取本月支出分类统计
    const [categoryRows] = await pool.execute(
      `SELECT 
        category,
        SUM(amount) as amount,
        COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND type = 'expense' 
         AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
       GROUP BY category
       ORDER BY amount DESC
       LIMIT 5`,
      [userId, currentMonth]
    );
    const categoryData = categoryRows as RowDataPacket[];
    const totalExpense = categoryData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const top_expense_categories: CategoryStats[] = categoryData.map(item => ({
      category: item.category,
      amount: parseFloat(item.amount),
      count: item.count,
      percentage: totalExpense > 0 ? (parseFloat(item.amount) / totalExpense) * 100 : 0
    }));

    // 获取近6个月趋势
    const [trendRows] = await pool.execute(
      `SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transaction_count
       FROM transactions 
       WHERE user_id = ? 
         AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
       ORDER BY month DESC`,
      [userId]
    );
    const monthly_trend: MonthlyStats[] = (trendRows as RowDataPacket[]).map(row => ({
      month: row.month,
      income: parseFloat(row.income),
      expense: parseFloat(row.expense),
      balance: parseFloat(row.income) - parseFloat(row.expense),
      transaction_count: row.transaction_count
    }));

    return {
      total_balance,
      month_income,
      month_expense,
      month_balance,
      recent_transactions,
      top_expense_categories,
      monthly_trend
    };
  }
}