import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SERVER_URL = "http://localhost:8083";

async function testGetProducts() {
  console.log("正在连接到 MCP SSE 服务器...");
  
  try {
    // 创建 SSE 传输
    const transport = new SSEClientTransport(new URL(`${SERVER_URL}/sse`));
    
    // 创建 MCP 客户端
    const client = new Client(
      {
        name: "test-client",
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
    console.log("可用工具:", JSON.stringify(toolsResponse.tools, null, 2));

    // 调用 getProducts 工具
    console.log("\n🛍️ 调用 getProducts 工具获取所有产品信息...");
    const result = await client.callTool({
      name: "purchase",
      arguments: {}
    });

    console.log("\n✨ 获取产品信息成功！");
    console.log("返回结果:");
    console.log("=".repeat(50));
    
    // 解析并美化显示结果
    if (result.content && result.content.length > 0) {
      const productData = JSON.parse(result.content[0].text);
      console.log("产品列表:");
      productData.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   价格: ¥${product.price}`);
        console.log(`   描述: ${product.description}`);
      });
    } else {
      console.log("未获取到产品数据");
    }
    
    console.log("=".repeat(50));

    // 关闭连接
    await client.close();
    console.log("\n🔌 连接已关闭");

  } catch (error) {
    console.error("❌ 调用失败:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行测试
testGetProducts().catch(console.error);