import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TransactionService } from "./services/transaction-service.js";
import { CredentialManager } from "./services/credential-manager.js";
import { ApiStorageService } from "./services/api-storage-service.js";

// 创建智能记账服务实例
const transactionService = new TransactionService();
const credentialManager = CredentialManager.getInstance();
const categoryList = `请根据交易内容选择合适的分类，没有合适的分类请使用“其他”：
支出分类：
餐饮 休闲娱乐 购物 穿搭美容 水果零食
交通 生活日用 人情社交 宠物 养娃
运动 生活服务 买菜 住房 爱车
发红包 转账 学习教育 网络虚拟 烟酒
医疗保健 金融保险 家居家电 酒店旅行 公益
互助保障 其他。

收入分类：
工资 兼职 投资理财 人情社交 奖金补贴
报销 生意 卖二手 生活费 中奖
收红包 收转账 保险理赔 退款 其他。
`
export const server = new McpServer({
  name: "smart-accounting-mcp",
  version: "1.0.0",
  description: "专业记账MCP服务器 - 仅用于记录明确的金钱收支交易。只有当用户明确表达要记录收入、支出、花费、赚钱等财务交易时才应调用此工具。不适用于平常聊天场景。"
});

// 检查重复交易工具 - 重复检测功能
server.tool(
  "checkDuplicateTransaction",
  "必须先检查是否存在重复或相似的交易记录 - 在记录交易前使用此工具检测潜在的重复记录，避免重复添加相同的交易。基于金额、描述、类型和时间窗口进行智能相似度匹配。",
  {
    type: z.enum(['income', 'expense']).describe("交易类型：income（收入）或 expense（支出）"),
    amount: z.number().positive().describe("交易金额，必须为正数"),
    description: z.string().min(1).describe("交易描述，用于相似度匹配"),
    category: z.string().optional().describe("交易分类(必须)，用于提高匹配准确性"),
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

// 记录交易工具 - 核心功能
server.tool(
  "recordTransaction",
  "记录金钱收支交易 - 仅当用户明确表达要记录具体的收入、支出、花费、购买等涉及金钱的交易时使用。不要用于技术问题、文件操作或其他非财务场景。",
  {
    type: z.enum(['income', 'expense']).describe("交易类型：income（收入）或 expense（支出）"),
    amount: z.number().positive().describe("交易金额，必须为正数"),
    category: z.string().optional().describe(`交易分类(必须)，${categoryList}`),
    description: z.string().min(1).describe("交易描述，必须记录用户的原始输入内容。"),
    tags: z.array(z.string()).optional().describe("交易标签(可选)，例如 ['reimbursement'] 表示可报销"),
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
      category: z.string().optional().describe(`交易分类(必须)，${categoryList}`),
      description: z.string().min(1).describe("交易描述，必须记录用户的原始输入内容。"),
      tags: z.array(z.string()).optional().describe("交易标签(可选)，例如 ['reimbursement'] 表示可报销")
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

// 获取当天交易记录工具
server.tool(
  "getTodayTransactions",
  "获取当天的财务交易记录 - 只返回今日的收支明细，相比获取全部记录更高效，减少上下文占用",
  {},
  async () => {
    console.log("获取当天交易记录");
    
    try {
      const todayTransactions = await transactionService.getTodayTransactions();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              date: new Date().toISOString().split('T')[0], // 当前日期 YYYY-MM-DD
              count: todayTransactions.length,
              transactions: todayTransactions.map(t => ({
                ...t,
                timestamp: t.timestamp
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("获取当天交易记录失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "获取当天交易记录失败"
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

// 账单管理限制说明工具 - 专门说明修改和删除功能的限制
server.tool(
  "getAccountingLimitations",
  "获取记账系统的功能限制说明 - 当用户询问修改、删除、编辑账单相关功能时，使用此工具说明系统限制，避免调用不支持的操作，需要重复记录时必须经过用户明确同意。",
  {},
  async () => {
    console.log("用户查询账单管理限制");
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            limitations: {
              modify: {
                supported: false,
                message: "修改账单功能暂时不支持",
                instruction: "如需修改已记录的账单，请手动到记账应用的网页版上进行操作"
              },
              delete: {
                supported: false,
                message: "删除账单功能暂时不支持",
                instruction: "如需删除已记录的账单，请手动到记账应用的网页版上进行操作"
              },
              edit: {
                supported: false,
                message: "编辑账单功能暂时不支持",
                instruction: "如需编辑已记录的账单，请手动到记账应用的网页版上进行操作"
              }
            },
            supportedOperations: [
              "记录新的收入交易",
              "记录新的支出交易",
              "批量记录多笔交易",
              "查看所有交易记录",
              "查看当天交易记录",
              "获取交易统计汇总",
              "检查重复交易记录"
            ],
            webAppNote: "所有修改、删除、编辑操作请在记账应用的网页版中完成，以确保数据安全性和一致性"
          }, null, 2)
        }
      ]
    };
  }
);

// 修改交易记录工具 - 提示不支持功能
server.tool(
  "updateTransaction",
  "修改已记录的财务交易 - 根据交易ID修改交易信息(暂时不支持，请手动到记账应用的网页版上进行操作)",
  {
    id: z.string().describe("要修改的交易记录ID"),
    type: z.enum(['income', 'expense']).optional().describe("交易类型：income（收入）或 expense（支出）"),
    amount: z.number().positive().optional().describe("交易金额，必须为正数"),
    category: z.string().optional().describe("交易分类"),
    description: z.string().optional().describe("交易描述"),
    tags: z.array(z.string()).optional().describe("交易标签")
  },
  async ({ id, type, amount, category, description, tags }) => {
    console.log("用户尝试修改交易记录", { id, type, amount, category, description, tags });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            supported: false,
            message: "抱歉，修改账单功能暂时不支持",
            instruction: "如需修改账单，请手动到记账应用的网页版上进行操作",
            requestedId: id,
            note: "为确保数据安全和一致性，修改功能需要在网页版中进行"
          }, null, 2)
        }
      ]
    };
  }
);

// 设置用户凭据工具 - 让用户动态配置自己的用户ID和访问令牌
server.tool(
  "setUserCredentials",
  "设置用户登录凭据 - 配置用户ID和API访问令牌，使MCP服务器能够访问您的个人账户数据。每个用户都需要设置自己的凭据才能使用记账功能。",
  {
    userId: z.string().min(1).describe("用户ID，从记账应用获取"),
    apiToken: z.string().min(10).describe("API访问令牌，从记账应用登录后获取")
  },
  async ({ userId, apiToken }) => {
    console.log("设置用户凭据", { userId: userId.substring(0, 8) + "..." });
    
    try {
      // 验证凭据格式
      const validation = credentialManager.validateCredentialsFormat(userId, apiToken);
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "凭据格式验证失败",
                errors: validation.errors
              }, null, 2)
            }
          ]
        };
      }

      // 设置凭据
      credentialManager.setCredentials(userId, apiToken);
      
      // 验证凭据是否有效
      try {
        const apiStorage = new ApiStorageService();
        const isValid = await apiStorage.validateConnection();
        
        if (!isValid) {
          credentialManager.clearCredentials();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  message: "凭据验证失败，请检查用户ID和API令牌是否正确"
                }, null, 2)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "用户凭据设置成功并已验证",
                userId: userId,
                status: "已配置并验证"
              }, null, 2)
            }
          ]
        };
      } catch (verifyError) {
        credentialManager.clearCredentials();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "凭据设置失败",
                error: verifyError instanceof Error ? verifyError.message : "API连接验证失败"
              }, null, 2)
            }
          ]
        };
      }
    } catch (error: any) {
      console.error("设置用户凭据失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "设置用户凭据失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 验证用户凭据工具
server.tool(
  "verifyUserCredentials",
  "验证当前用户凭据 - 检查已设置的用户ID和API令牌是否有效，确保可以正常访问记账服务",
  {},
  async () => {
    console.log("验证用户凭据");
    
    try {
      if (!credentialManager.hasCredentials()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "用户凭据未设置，请先使用 setUserCredentials 工具设置",
                configured: false
              }, null, 2)
            }
          ]
        };
      }

      const apiStorage = new ApiStorageService();
      const isValid = await apiStorage.validateConnection();
      
      if (!isValid) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "凭据验证失败，请检查用户ID和API令牌是否正确",
                configured: true,
                valid: false
              }, null, 2)
            }
          ]
        };
      }

      const status = credentialManager.getCredentialStatus();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "用户凭据验证成功",
              configured: true,
              valid: true,
              userId: status.userId
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("验证用户凭据失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "验证用户凭据时发生错误"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 获取用户信息工具
server.tool(
  "getUserProfile",
  "获取当前用户个人信息 - 显示已登录用户的基本信息和账户状态",
  {},
  async () => {
    console.log("获取用户个人信息");
    
    try {
      if (!credentialManager.hasCredentials()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "用户凭据未设置，请先使用 setUserCredentials 工具设置",
                configured: false
              }, null, 2)
            }
          ]
        };
      }

      const apiStorage = new ApiStorageService();
      const userInfo = await apiStorage.getUserInfo();
      const credentialStatus = credentialManager.getCredentialStatus();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "获取用户信息成功",
              userInfo: userInfo,
              credentialStatus: credentialStatus
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("获取用户信息失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "获取用户信息失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 获取凭据状态工具
server.tool(
  "getCredentialStatus",
  "获取用户凭据配置状态 - 显示当前是否已配置用户凭据以及配置状态信息",
  {},
  async () => {
    console.log("获取凭据状态");
    
    try {
      const status = credentialManager.getCredentialStatus();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              credentialStatus: status,
              message: status.isConfigured
                ? `用户 ${status.userId} 的凭据已配置`
                : "用户凭据未配置，请使用 setUserCredentials 工具设置"
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("获取凭据状态失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "获取凭据状态失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 清空用户凭据工具
server.tool(
  "clearUserCredentials",
  "清空用户凭据 - 删除已设置的用户ID和API令牌，清空登录状态",
  {},
  async () => {
    console.log("清空用户凭据");
    
    try {
      credentialManager.clearCredentials();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "用户凭据已清空，如需使用记账功能请重新设置凭据"
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("清空用户凭据失败:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: "清空用户凭据失败"
            }, null, 2)
          }
        ]
      };
    }
  }
);

// 删除交易记录工具 - 提示不支持功能
server.tool(
  "deleteTransaction",
  "删除已记录的财务交易 - 根据交易ID删除交易记录(暂时不支持，请手动到记账应用的网页版上进行操作)",
  {
    id: z.string().describe("要删除的交易记录ID")
  },
  async ({ id }) => {
    console.log("用户尝试删除交易记录", { id });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            supported: false,
            message: "抱歉，删除账单功能暂时不支持",
            instruction: "如需删除账单，请手动到记账应用的网页版上进行操作",
            requestedId: id,
            note: "为确保数据安全和防止误删，删除功能需要在网页版中进行"
          }, null, 2)
        }
      ]
    };
  }
);