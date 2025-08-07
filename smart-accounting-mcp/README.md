# 智能记账MCP服务器

这是一个基于MCP（Model Context Protocol）的智能记账服务器，为大语言模型提供记账功能。

## 功能特性

- 🤖 **MCP协议支持**：通过MCP协议与Claude等大语言模型集成
- 💰 **交易记录管理**：记录收入和支出交易
- 🏷️ **智能分类**：自动分类交易类型
- 📊 **数据统计**：提供交易统计和汇总功能
- 🔄 **多种存储模式**：支持本地JSON文件和远程API存储
- 🎯 **相对时间解析**：支持"昨天"、"上周"等时间描述

## 存储模式

### API存储模式（推荐）
- 将数据存储到远程API服务器
- 支持多用户数据隔离
- 提供云端数据同步
- 需要配置用户认证

### 文件存储模式
- 将数据存储到本地JSON文件
- 适合单机使用
- 无需网络连接

## 快速开始

### 1. 安装依赖

```bash
cd smart-accounting-mcp
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件配置：

#### API存储模式配置
```env
STORAGE_MODE=api
API_BASE_URL=http://localhost:3000/api
API_TOKEN=你的JWT令牌
USER_ID=你的用户ID
```

#### 文件存储模式配置
```env
STORAGE_MODE=file
DB_PATH=db.json
```

### 3. 获取用户认证信息（API模式）

如果使用API存储模式，需要先获取认证信息：

1. 启动后台服务器：
   ```bash
   cd jizhang-jingling-server
   npm run dev
   ```

2. 在小程序中注册/登录账户
3. 复制用户ID和访问令牌到 `.env` 文件

### 4. 启动MCP服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## MCP工具

### add_transaction
记录一笔交易

**参数：**
- `type` (required): 交易类型 ("income" | "expense")
- `amount` (required): 金额 (number)
- `description` (required): 描述 (string)
- `category` (optional): 分类 (string)
- `tags` (optional): 标签数组 (string[])

**示例：**
```json
{
  "type": "expense",
  "amount": 50,
  "description": "午餐费用",
  "category": "餐饮",
  "tags": ["日常开销"]
}
```

### add_transactions_batch
批量记录多笔交易

**参数：**
- `transactions` (required): 交易数组

### get_all_transactions
获取所有交易记录

### get_today_transactions
获取今天的交易记录

### get_transaction_summary
获取交易统计汇总

### check_duplicate_transaction
检查是否有重复的交易记录

## 智能功能

### 自动分类
系统会根据描述自动分类交易：
- 餐饮：午餐、晚餐、咖啡等
- 交通：打车、地铁、公交等
- 购物：买衣服、超市购物等
- 娱乐：电影、游戏、KTV等

### 相对时间解析
支持自然语言时间描述：
- "昨天买了咖啡" → 自动设置为昨天的时间
- "上周看电影" → 自动设置为上周的时间
- "前天的午餐" → 自动设置为前天的时间

## 在Claude Desktop中使用

在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "smart-accounting": {
      "command": "node",
      "args": ["path/to/smart-accounting-mcp/dist/mcp-sse-server.js"],
      "env": {
        "STORAGE_MODE": "api",
        "API_BASE_URL": "http://localhost:3000/api",
        "API_TOKEN": "your_jwt_token",
        "USER_ID": "your_user_id"
      }
    }
  }
}
```

## 开发指南

### 项目结构
```
src/
├── config.ts           # 配置管理
├── types/              # 类型定义
├── services/           # 业务服务
│   ├── storage-service.ts        # 文件存储服务
│   ├── api-storage-service.ts    # API存储服务
│   └── transaction-service.ts    # 交易业务逻辑
├── utils/              # 工具函数
└── mcp-sse-server.ts   # MCP服务器入口
```

### 添加新功能

1. 在 `types/` 中定义类型
2. 在 `services/` 中实现业务逻辑
3. 在 `mcp-sse-server.ts` 中注册MCP工具
4. 更新测试用例

## 环境变量说明

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `STORAGE_MODE` | string | `api` | 存储模式：`file` 或 `api` |
| `DB_PATH` | string | `db.json` | 文件存储模式下的数据库路径 |
| `API_BASE_URL` | string | `http://localhost:3000/api` | API服务器地址 |
| `API_TOKEN` | string | - | JWT访问令牌 |
| `USER_ID` | string | - | 用户唯一标识 |
| `API_TIMEOUT` | number | `10000` | API请求超时时间(ms) |
| `PORT` | number | `8083` | MCP服务器端口 |
| `LOG_LEVEL` | string | `info` | 日志级别 |

## 故障排除

### 常见问题

1. **API连接失败**
   - 检查后台服务器是否启动
   - 确认API_BASE_URL配置正确
   - 验证API_TOKEN是否有效

2. **用户认证失败**
   - 确认USER_ID和API_TOKEN匹配
   - 检查令牌是否过期
   - 重新登录获取新令牌

3. **数据同步问题**
   - 检查网络连接
   - 查看服务器日志
   - 确认数据库连接正常

### 日志调试

启动服务时查看日志：
```bash
LOG_LEVEL=debug npm run dev
```

## 许可证

MIT License