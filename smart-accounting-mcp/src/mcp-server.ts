import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TransactionService } from "./services/transaction-service.js";

// 创建智能记账服务实例
const transactionService = new TransactionService();

export const server = new McpServer({
  name: "smart-accounting-mcp",
  version: "1.0.0",
  description: "专业记账MCP服务器 - 仅用于记录明确的金钱收支交易。只有当用户明确表达要记录收入、支出、花费、赚钱等财务交易时才应调用此工具。不适用于平常聊天场景。"
});

// 记录交易工具 - 核心功能
server.tool(
  "recordTransaction",
  "记录金钱收支交易 - 仅当用户明确表达要记录具体的收入、支出、花费、购买等涉及金钱的交易时使用。不要用于技术问题、文件操作或其他非财务场景。",
  {
    type: z.enum(['income', 'expense']).describe("交易类型：income（收入）或 expense（支出）"),
    amount: z.number().positive().describe("交易金额，必须为正数"),
    category: z.string().optional().describe("交易分类（可选），如：餐饮美食、交通出行、服装鞋帽、电子产品等。如未提供将自动分类"),
    description: z.string().min(1).describe("交易描述，记录用户的原始输入内容"),
    tags: z.array(z.string()).optional().describe("交易标签（可选），例如 ['reimbursement'] 表示可报销")
  },
  async ({ type, amount, category, description, tags }) => {
    console.log("处理记账请求", { type, amount, category, description, tags });
    
    try {
      const transaction = await transactionService.recordTransaction({
        type,
        amount,
        category,
        description,
        tags
      });

      // 构建确认消息
      const typeText = type === 'expense' ? '支出' : '收入';
      const reimbursableText = tags?.includes('reimbursement') || tags?.includes('可报销') ? '可报销' : '';
      const confirmMessage = `已记录${reimbursableText}${typeText}：${transaction.category} ¥${transaction.amount}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: confirmMessage,
              transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: transaction.amount,
                category: transaction.category,
                description: transaction.description,
                tags: transaction.tags,
                timestamp: transaction.timestamp
              }
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("记账失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "记账失败，请检查输入信息"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 批量记录交易工具 - 解决并发问题的核心功能
server.tool(
  "recordTransactionBatch",
  "批量记录多笔金钱收支交易 - 当用户在一句话中提到多笔交易时使用此工具，可避免并发写入问题。例如：'今天买了早餐7块钱，还买了雪糕2块钱，还买了衣服200块钱'，仅当用户明确表达要记录具体的收入、支出、花费、购买等涉及金钱的交易时使用。",
  {
    transactions: z.array(z.object({
      type: z.enum(['income', 'expense']).describe("交易类型：income（收入）或 expense（支出）"),
      amount: z.number().positive().describe("交易金额，必须为正数"),
      category: z.string().optional().describe("交易分类（可选），如：餐饮美食、交通出行、服装鞋帽、电子产品等。如未提供将自动分类"),
      description: z.string().min(1).describe("交易描述，记录用户的原始输入内容"),
      tags: z.array(z.string()).optional().describe("交易标签（可选），例如 ['reimbursement'] 表示可报销")
    })).min(1).describe("交易记录数组，至少包含一笔交易")
  },
  async ({ transactions }) => {
    console.log("处理批量记账请求", { count: transactions.length, transactions });
    
    try {
      const savedTransactions = await transactionService.recordTransactionBatch(transactions);

      // 构建确认消息
      const totalAmount = savedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const expenseCount = savedTransactions.filter(t => t.type === 'expense').length;
      const incomeCount = savedTransactions.filter(t => t.type === 'income').length;
      
      let summaryMessage = `已批量记录 ${savedTransactions.length} 笔交易`;
      if (expenseCount > 0) summaryMessage += `，支出 ${expenseCount} 笔`;
      if (incomeCount > 0) summaryMessage += `，收入 ${incomeCount} 笔`;
      summaryMessage += `，总金额 ¥${totalAmount}`;

      const detailMessages = savedTransactions.map(t => {
        const typeText = t.type === 'expense' ? '支出' : '收入';
        const reimbursableText = t.tags?.includes('reimbursement') || t.tags?.includes('可报销') ? '可报销' : '';
        return `${reimbursableText}${typeText}：${t.category} ¥${t.amount}`;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: summaryMessage,
              details: detailMessages,
              transactions: savedTransactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                category: t.category,
                description: t.description,
                tags: t.tags,
                timestamp: t.timestamp
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("批量记账失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "批量记账失败，请检查输入信息"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 获取所有交易记录工具
server.tool(
  "getAllTransactions",
  "获取所有已记录的财务交易记录 - 用于查看历史收支明细",
  {},
  async () => {
    console.log("获取所有交易记录");
    
    try {
      const transactions = await transactionService.getAllTransactions();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              count: transactions.length,
              transactions: transactions.map(t => ({
                ...t,
                timestamp: t.timestamp
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("获取交易记录失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "获取交易记录失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 获取交易统计工具
server.tool(
  "getTransactionSummary",
  "获取财务统计汇总 - 计算总收入、总支出、余额等统计信息",
  {},
  async () => {
    console.log("获取交易统计信息");
    
    try {
      const summary = await transactionService.getTransactionSummary();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              summary: {
                totalIncome: summary.totalIncome,
                totalExpense: summary.totalExpense,
                balance: summary.balance,
                transactionCount: summary.transactionCount
              },
              message: `总收入: ¥${summary.totalIncome}, 总支出: ¥${summary.totalExpense}, 余额: ¥${summary.balance}, 记录数: ${summary.transactionCount}`
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("获取交易统计失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "获取交易统计失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 检查重复交易工具 - 重复检测功能
server.tool(
  "checkDuplicateTransaction",
  "检查是否存在重复或相似的交易记录 - 在记录交易前使用此工具检测潜在的重复记录，避免重复添加相同的交易。基于金额、描述、类型和时间窗口进行智能相似度匹配。",
  {
    type: z.enum(['income', 'expense']).describe("交易类型：income（收入）或 expense（支出）"),
    amount: z.number().positive().describe("交易金额，必须为正数"),
    description: z.string().min(1).describe("交易描述，用于相似度匹配"),
    category: z.string().optional().describe("交易分类（可选），用于提高匹配准确性"),
    hoursBack: z.number().positive().default(24).optional().describe("检查时间窗口（小时），默认24小时")
  },
  async ({ type, amount, description, category, hoursBack = 24 }) => {
    console.log("检查重复交易", { type, amount, description, category, hoursBack });
    
    try {
      const result = await transactionService.checkDuplicateTransaction({
        type,
        amount,
        description,
        category
      }, hoursBack);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              hasSimilar: result.hasSimilar,
              suggestion: result.suggestion,
              similarCount: result.similarTransactions.length,
              similarTransactions: result.similarTransactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                description: tx.description,
                timestamp: tx.timestamp,
                similarity: Math.round(tx.similarity * 100) / 100, // 保留2位小数
                timeDiff: Math.round((Date.now() - new Date(tx.timestamp).getTime()) / (1000 * 60)) // 分钟差
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("检查重复交易失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "检查重复交易失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);