# 智能记账 MCP 系统

## 项目概述

这是一个基于 MCP (Model Context Protocol) 的智能记账系统，它已经从原有的购物系统成功改造而来。系统能够接收结构化的交易数据并进行自动分类记账。

## 核心功能

### 1. 记录交易 (`recordTransaction`)
- **功能**: 记录一笔收入或支出交易
- **参数**:
  - `type`: 交易类型 ('income' | 'expense')
  - `amount`: 金额 (必须为正数)
  - `category`: 分类 (可选，自动分配默认值)
  - `description`: 描述信息 (必需)
  - `tags`: 标签数组 (可选，支持 'reimbursement' 标记)

### 2. 获取所有交易记录 (`getAllTransactions`)
- **功能**: 返回所有已记录的交易
- **返回**: 包含所有交易记录的数组

### 3. 获取交易统计 (`getTransactionSummary`)
- **功能**: 获取收入、支出、余额和记录数统计
- **返回**: 财务摘要信息

## 技术架构

### 数据模型

#### TransactionData (输入数据)
```typescript
interface TransactionData {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  description: string;
  tags?: string[];
}
```

#### Transaction (存储模型)
```typescript
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  tags: string[];
  timestamp: Date;
}
```

### 服务层

#### StorageService
- 负责数据持久化到 JSON 文件
- 支持异步读写操作
- 自动处理文件不存在的情况

#### TransactionService
- 处理业务逻辑和数据验证
- 自动生成交易ID和时间戳
- 支持默认分类分配

### 文件结构

```
mcp-sse-server/
├── src/
│   ├── services/
│   │   ├── storage-service.ts     # 数据存储服务
│   │   ├── transaction-service.ts # 交易业务逻辑
│   │   └── inventory-service.ts   # 原购物系统(已弃用)
│   ├── types/
│   │   ├── transaction.ts         # 交易数据类型
│   │   └── index.ts              # 类型导出
│   ├── utils/
│   │   └── id-generator.ts       # 工具函数
│   ├── mcp-server.ts             # MCP 服务器主文件
│   └── mcp-sse-server.ts         # SSE 服务器启动
├── tests/
│   ├── services/
│   │   ├── storage.test.ts       # 存储服务测试
│   │   └── transaction.test.ts   # 交易服务测试
│   └── mcp-server.integration.test.ts # 集成测试
└── jest.config.js                # Jest 配置
```

## 需求实现

### ✅ 已实现的需求

1. **记录无明确分类的支出** - 支持自动分配"未分类消费"
2. **记录有明确分类的支出** - 支持智能分类识别
3. **记录收入** - 支持收入记录和自动分类
4. **系统反馈** - 提供详细的确认消息
5. **标记可报销支出** - 支持 'reimbursement' 标签

### 验收标准完成情况

- ✅ 支持多种金额表达方式
- ✅ 自动分类到预设类别
- ✅ 智能判断并分配正确类别
- ✅ 准确提取金额信息
- ✅ 提供确认反馈消息
- ✅ 错误处理和提示

## 启动和使用

### 开发模式启动
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 运行测试
```bash
npm test
```

## API 使用示例

### 记录支出
```json
{
  "type": "expense",
  "amount": 100,
  "category": "购物",
  "description": "买衣服",
  "tags": ["clothing"]
}
```

### 记录可报销支出
```json
{
  "type": "expense",
  "amount": 50,
  "category": "交通",
  "description": "打车费用",
  "tags": ["reimbursement"]
}
```

### 记录收入
```json
{
  "type": "income",
  "amount": 5000,
  "description": "工资收入"
}
```