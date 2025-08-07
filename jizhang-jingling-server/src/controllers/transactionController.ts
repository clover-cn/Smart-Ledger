import { Request, Response } from 'express';
import { z } from 'zod';
import { TransactionService } from '../services/transactionService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// 输入验证schemas
const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: '交易类型必须是 income 或 expense' })
  }),
  amount: z.number()
    .positive('金额必须大于0')
    .max(999999999.99, '金额过大'),
  category: z.string()
    .min(1, '类别不能为空')
    .max(100, '类别名称最多100个字符'),
  description: z.string()
    .max(1000, '描述最多1000个字符')
    .optional(),
  tags: z.array(z.string().max(50, '标签最多50个字符'))
    .max(10, '最多10个标签')
    .optional(),
  transaction_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是 YYYY-MM-DD')
    .optional()
});

const updateTransactionSchema = createTransactionSchema.partial();

const queryTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '开始日期格式必须是 YYYY-MM-DD')
    .optional(),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '结束日期格式必须是 YYYY-MM-DD')
    .optional(),
  page: z.string()
    .transform(val => parseInt(val))
    .refine(val => val > 0, '页码必须大于0')
    .optional(),
  limit: z.string()
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, '每页数量必须在1-100之间')
    .optional(),
  tags: z.union([
    z.string().transform(val => [val]),
    z.array(z.string())
  ]).optional()
});

export class TransactionController {
  private transactionService = new TransactionService();

  // 创建交易记录
  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const validatedData = createTransactionSchema.parse(req.body);
    
    const transaction = await this.transactionService.createTransaction(
      req.user.userId, 
      validatedData
    );

    res.status(201).json({
      success: true,
      data: transaction,
      message: '交易记录创建成功'
    });
  });

  // 获取交易记录列表
  getList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const queryParams = queryTransactionSchema.parse(req.query);
    
    const result = await this.transactionService.getTransactions(
      req.user.userId,
      queryParams
    );

    res.json(result);
  });

  // 获取单个交易记录
  getById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: '交易记录ID不能为空'
      });
    }

    const transaction = await this.transactionService.getTransactionById(
      req.user.userId,
      id
    );

    res.json({
      success: true,
      data: transaction
    });
  });

  // 更新交易记录
  update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: '交易记录ID不能为空'
      });
    }

    const validatedData = updateTransactionSchema.parse(req.body);
    
    const transaction = await this.transactionService.updateTransaction(
      req.user.userId,
      id,
      validatedData
    );

    res.json({
      success: true,
      data: transaction,
      message: '交易记录更新成功'
    });
  });

  // 删除交易记录
  delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: '交易记录ID不能为空'
      });
    }

    await this.transactionService.deleteTransaction(req.user.userId, id);

    res.json({
      success: true,
      message: '交易记录删除成功'
    });
  });

  // 获取dashboard统计数据
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const stats = await this.transactionService.getDashboardStats(req.user.userId);

    res.json({
      success: true,
      data: stats
    });
  });

  // 批量创建交易记录（用于MCP服务器调用）
  batchCreate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'transactions必须是数组'
      });
    }

    const results = [];
    for (const transactionData of transactions) {
      try {
        const validatedData = createTransactionSchema.parse(transactionData);
        const transaction = await this.transactionService.createTransaction(
          req.user.userId,
          validatedData
        );
        results.push(transaction);
      } catch (error) {
        console.error('批量创建交易记录失败:', error);
        results.push({
          error: error instanceof Error ? error.message : '创建失败',
          data: transactionData
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `批量创建完成，成功创建 ${results.filter(r => !('error' in r)).length} 条记录`
    });
  });
}