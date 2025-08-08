# Smart Accounting MCP

智能记账 MCP (Model Context Protocol) 服务器，提供专业的财务记录和管理功能。


**支持通过URL参数进行用户认证**

### MCP配置方式

```json
{
  "smart-accounting-mcp": {
    "url": "http://127.0.0.1:8083/sse?userId=YOUR_USER_ID&apiToken=YOUR_API_TOKEN",
    "transport": "sse"
  }
}
```

### 优势

- ✅ **服务重启后凭据不会失效** - 认证信息保存在URL中
- ✅ **多用户支持** - 每个用户使用自己的URL配置
- ✅ **一次配置，永久有效** - 无需重复设置凭据
- ✅ **更安全的会话管理** - 每个连接独立管理

## 功能特性

- 📊 智能记账：支持收入和支出记录
- 🔍 重复检测：自动检测相似交易，避免重复记录
- 📈 统计分析：提供财务汇总和统计信息
- 🏷️ 分类管理：支持详细的收支分类
- 🔄 批量操作：支持批量记录多笔交易
- 🌐 SSE支持：基于Server-Sent Events的实时通信
- 👥 多用户支持：支持多个用户同时使用
- 🔐 URL认证：通过URL参数进行用户认证

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 编译TypeScript

```bash
npm run build
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:8083` 启动。

### 4. 开发模式

```bash
npm run dev
```

## MCP 客户端配置

### MCP配置方式（URL认证）

```json
{
  "smart-accounting-mcp": {
    "url": "http://127.0.0.1:8083/sse?userId=YOUR_USER_ID&apiToken=YOUR_API_TOKEN",
    "transport": "sse"
  }
}
```

**请将 `YOUR_USER_ID` 和 `YOUR_API_TOKEN` 替换为你的实际用户ID和API令牌。**



## 可用工具

### 核心记账功能

1. **checkDuplicateTransaction** - 检查重复交易
2. **recordTransaction** - 记录单笔交易
3. **recordTransactionBatch** - 批量记录交易

### 查询功能

4. **getTodayTransactions** - 获取当天交易记录
5. **getAllTransactions** - 获取所有交易记录
6. **getTransactionSummary** - 获取交易统计汇总

### 系统信息

7. **getAccountingLimitations** - 获取系统功能限制说明
8. **updateTransaction** - 修改交易记录（暂不支持，提示用户使用网页版）
9. **deleteTransaction** - 删除交易记录（暂不支持，提示用户使用网页版）

## 使用说明

### 使用方式（URL认证）

1. **配置MCP客户端**：
   ```json
   {
     "smart-accounting-mcp": {
       "url": "http://127.0.0.1:8083/sse?userId=YOUR_USER_ID&apiToken=YOUR_API_TOKEN",
       "transport": "sse"
     }
   }
   ```

2. **直接开始记账**：
   - 无需设置凭据，直接使用记账功能
   - 服务重启后无需重新配置
   - 每个用户使用独立的URL配置

### 记录交易

1. **检查重复**（推荐）：
   ```
   先使用 checkDuplicateTransaction 检查是否有相似交易
   ```

2. **记录交易**：
   ```
   使用 recordTransaction 记录单笔交易
   或使用 recordTransactionBatch 批量记录
   ```

### 查看记录

- 查看今日记录：`getTodayTransactions`
- 查看所有记录：`getAllTransactions`
- 查看统计汇总：`getTransactionSummary`

## 交易分类

### 支出分类
餐饮、休闲娱乐、购物、穿搭美容、水果零食、交通、生活日用、人情社交、宠物、养娃、运动、生活服务、买菜、住房、爱车、发红包、转账、学习教育、网络虚拟、烟酒、医疗保健、金融保险、家居家电、酒店旅行、公益、互助保障、其他

### 收入分类
工资、兼职、投资理财、人情社交、奖金补贴、报销、生意、卖二手、生活费、中奖、收红包、收转账、保险理赔、退款、其他

## 多用户支持

- 每个用户使用独立的URL配置
- 支持多个用户同时连接和使用
- 会话自动管理，1小时未活动自动清理
- 连接断开时自动清理会话数据

## 注意事项

- ✅ **推荐使用URL认证方式** - 更稳定，无需重复设置
- ⚠️ 修改和删除功能暂时不支持，需要在网页版中操作
- ✅ **服务器重启后URL认证方式无需重新配置**
- 💡 建议在记录前先检查重复交易
- 🏷️ 支持可报销标签：在tags中添加 'reimbursement' 或 '可报销'

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