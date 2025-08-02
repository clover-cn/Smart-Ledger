import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SERVER_URL = "http://localhost:8083";

async function testBatchTransactions() {
  console.log("🚀 开始测试批量交易记录功能...");
  console.log("模拟用户输入：'我今天早餐吃了7块钱，还买了一个雪糕2块钱，还逛街买了一件衣服花了200块钱'");
  
  try {
    // 创建 SSE 传输
    const transport = new SSEClientTransport(new URL(`${SERVER_URL}/sse`));
    
    // 创建 MCP 客户端
    const client = new Client(
      {
        name: "batch-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // 连接到服务器
    await client.connect(transport);
    console.log("✅ 成功连接到 MCP 服务器");

    // 获取可用工具列表
    console.log("\n📋 获取可用工具列表...");
    const toolsResponse = await client.listTools();
    console.log("可用工具:", toolsResponse.tools.map(t => t.name).join(', '));

    // 测试1：使用新的批量记录工具
    console.log("\n🛍️ 测试批量记录交易（推荐方式）...");
    const batchResult = await client.callTool({
      name: "recordTransactionBatch",
      arguments: {
        transactions: [
          {
            type: "expense",
            amount: 7,
            description: "早餐",
            category: "餐饮美食"
          },
          {
            type: "expense", 
            amount: 2,
            description: "雪糕",
            category: "餐饮美食"
          },
          {
            type: "expense",
            amount: 200,
            description: "衣服",
            category: "服装鞋帽"
          }
        ]
      }
    });

    console.log("\n✨ 批量记录结果:");
    console.log("=".repeat(60));
    if (batchResult.content && batchResult.content.length > 0) {
      const result = JSON.parse(batchResult.content[0].text);
      console.log("成功:", result.success);
      console.log("消息:", result.message);
      console.log("详细信息:");
      result.details?.forEach((detail, index) => {
        console.log(`  ${index + 1}. ${detail}`);
      });
    }
    console.log("=".repeat(60));

    // 验证记录是否正确保存
    console.log("\n📊 验证所有交易记录...");
    const allTransactions = await client.callTool({
      name: "getAllTransactions",
      arguments: {}
    });

    if (allTransactions.content && allTransactions.content.length > 0) {
      const transactionsData = JSON.parse(allTransactions.content[0].text);
      console.log(`数据库中共有 ${transactionsData.count} 笔交易记录:`);
      transactionsData.transactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.type === 'expense' ? '支出' : '收入'}: ¥${t.amount} - ${t.category} (${t.description})`);
      });
    }

    // 获取统计信息
    console.log("\n📈 获取统计信息...");
    const summary = await client.callTool({
      name: "getTransactionSummary", 
      arguments: {}
    });

    if (summary.content && summary.content.length > 0) {
      const summaryData = JSON.parse(summary.content[0].text);
      console.log("统计结果:", summaryData.message);
    }

    // 关闭连接
    await client.close();
    console.log("\n🔌 连接已关闭");
    console.log("\n🎉 批量交易记录测试完成！");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行测试
testBatchTransactions().catch(console.error);