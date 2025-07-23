import express from 'express';
import cors from 'cors';

// 导入服务模块
import { IntentService } from './intentService.js';
import { RecommendationService } from './recommendationService.js';
import { AdService } from './adService.js';
import { mockProducts, mockAds } from './mockData.js';

// 创建服务实例
const intentService = new IntentService();
const recommendationService = new RecommendationService();
const adService = new AdService();
const mockData = { products: mockProducts, advertisements: mockAds };

const app = express();
const PORT = 8007;

// 中间件配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control', 'Mcp-Session-Id'],
  credentials: false
}));

app.use(express.json());

// 会话管理
const sessions = new Map();

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

// 工具定义
const tools = [
  {
    name: 'analyze_intent',
    description: '分析用户输入的购买意图',
    inputSchema: {
      type: 'object',
      properties: {
        userInput: {
          type: 'string',
          description: '用户输入的文本'
        }
      },
      required: ['userInput']
    }
  },
  {
    name: 'get_recommendations',
    description: '根据用户输入获取个性化推荐',
    inputSchema: {
      type: 'object',
      properties: {
        userInput: {
          type: 'string',
          description: '用户输入的文本'
        },
        userId: {
          type: 'string',
          description: '用户ID（可选）',
          default: 'user1'
        }
      },
      required: ['userInput']
    }
  },
  {
    name: 'recommend_by_brand',
    description: '根据品牌推荐产品',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: '品牌名称'
        },
        limit: {
          type: 'number',
          description: '推荐数量限制',
          default: 5
        }
      },
      required: ['brand']
    }
  },
  {
    name: 'get_all_products',
    description: '获取所有产品信息',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: '产品类别（可选）'
        }
      }
    }
  },
  {
    name: 'get_all_ads',
    description: '获取所有广告信息',
    inputSchema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: '是否只返回活跃广告',
          default: true
        }
      }
    }
  }
];

// 工具执行函数
async function executeTool(name, args) {
  try {
    switch (name) {
      case 'analyze_intent':
        const intentResult = intentService.analyzeIntent(args.userInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(intentResult, null, 2)
            }
          ]
        };

      case 'get_recommendations':
        // 首先分析意图
        const intent = intentService.analyzeIntent(args.userInput);
        // 然后生成推荐
        const recommendations = recommendationService.generateRecommendations(
          intent,
          args.userId || 'user1'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(recommendations, null, 2)
            }
          ]
        };

      case 'recommend_by_brand':
        console.log('品牌推荐请求:', args);
        const brandRecommendations = recommendationService.recommendByBrand(
          args.brand,
          null, // category
          args.limit || 5
        );
        console.log('品牌推荐结果:', brandRecommendations);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(brandRecommendations, null, 2)
            }
          ]
        };

      case 'get_all_products':
        let products = mockData.products;
        if (args.category) {
          products = products.filter(p => 
            p.category.toLowerCase().includes(args.category.toLowerCase())
          );
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(products, null, 2)
            }
          ]
        };

      case 'get_all_ads':
        let ads = mockData.advertisements;
        if (args.active) {
          ads = ads.filter(ad => ad.status === 'active');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(ads, null, 2)
            }
          ]
        };

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    name: '工作版智能推荐MCP服务',
    version: '1.0.0',
    status: 'running',
    mcp_endpoint: '/mcp',
    description: '简化但有效的MCP服务器实现'
  });
});

// MCP端点 - POST请求处理
app.post('/mcp', async (req, res) => {
  console.log('收到MCP POST请求:', JSON.stringify(req.body, null, 2));
  
  try {
    const request = req.body;
    let sessionId = req.headers['mcp-session-id'];
    
    // 处理初始化请求
    if (request.method === 'initialize') {
      sessionId = generateSessionId();
      sessions.set(sessionId, { initialized: true });
      res.setHeader('Mcp-Session-Id', sessionId);
      console.log('创建新会话:', sessionId);
      
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'smart-trigger-mcp',
            version: '1.0.0'
          }
        }
      };
      
      console.log('发送初始化响应:', JSON.stringify(response, null, 2));
      return res.json(response);
    }
    
    // 处理工具列表请求
    if (request.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: tools
        }
      };
      
      console.log('发送工具列表响应:', JSON.stringify(response, null, 2));
      return res.json(response);
    }
    
    // 处理工具调用请求
    if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      const result = await executeTool(name, args);
      
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: result
      };
      
      console.log('发送工具调用响应:', JSON.stringify(response, null, 2));
      return res.json(response);
    }
    
    // 处理其他请求
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32601,
        message: '方法未找到: ' + request.method
      }
    };
    
    console.log('发送错误响应:', JSON.stringify(response, null, 2));
    res.json(response);
    
  } catch (error) {
    console.error('处理MCP请求错误:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

// MCP端点 - GET请求处理（SSE支持）
app.get('/mcp', (req, res) => {
  console.log('收到MCP GET请求');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 发送连接确认
  res.write('data: {"type":"connection","status":"connected"}\n\n');
  
  // 保持连接
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);
  
  req.on('close', () => {
    console.log('SSE连接关闭');
    clearInterval(keepAlive);
  });
  
  req.on('error', (error) => {
    console.error('SSE连接错误:', error);
    clearInterval(keepAlive);
  });
});

// 会话删除端点
app.delete('/mcp', (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log('删除会话:', sessionId);
    res.status(204).send();
  } else {
    res.status(404).json({ error: '会话未找到' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`工作版智能推荐MCP服务运行在 http://localhost:${PORT}`);
  console.log(`MCP端点: http://localhost:${PORT}/mcp`);
  console.log('🚀 简化但有效的MCP实现！');
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});