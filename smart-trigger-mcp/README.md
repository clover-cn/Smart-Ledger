# 智能推荐MCP服务

基于意图识别的广告推荐系统，通过分析用户与AI的对话内容，智能识别购买意图并推荐相关产品广告。

## 目录

- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
  - [安装依赖](#安装依赖)
  - [启动服务](#启动服务)
  - [MCP客户端配置](#mcp客户端配置)
- [API文档](#api文档)
  - [MCP工具](#mcp工具)
  - [REST API](#rest-api)
- [使用示例](#使用示例)
- [模拟数据](#模拟数据)
- [开发说明](#开发说明)
- [许可证](#许可证)

## 功能特性

- 🧠 **智能意图识别**: 支持显式和隐式购买意图识别
- 🎯 **个性化推荐**: 基于用户画像和历史行为的个性化产品推荐
- 📊 **广告管理**: 完整的广告创建、管理和统计功能
- 💰 **收益分成**: 自动计算广告展示和转化收益
- 🔌 **MCP协议支持**: 支持标准MCP协议，可集成到各种AI平台
- 🌐 **远程服务**: 支持HTTP API和SSE连接

## 项目结构

```
smart-trigger-mcp/
├── src/
│   ├── index.js           # MCP服务器主文件（HTTP模式）
│   ├── intentService.js   # 意图识别服务
│   ├── recommendationService.js  # 推荐引擎
│   ├── adService.js       # 广告管理服务
│   └── mockData.js        # 模拟数据
├── design.md              # 系统设计文档
├── requirements.md        # 需求文档
├── tasks.md               # 实施计划
├── package.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

或

```bash
node src/index.js
```

服务器将在 `http://localhost:8007` 启动

### MCP客户端配置

#### 远程配置

```json
{
  "mcpServers": {
    "smart-trigger-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "http://127.0.0.1:8007/mcp"],
      "disabled": false,
      "alwaysAllow": ["analyze_intent", "get_recommendations", "recommend_by_brand", "get_all_products", "get_all_ads"],
      "disabledTools": []
    }
  }
}
```

## API文档

### MCP工具

#### 1. analyze_intent

分析用户输入文本，识别购买意图

**参数:**

- `userInput` (string): 用户输入的文本内容

**示例:**

```javascript
{
  "userInput": "哪家自行车比较好？"
}
```

#### 2. get_recommendations

根据意图生成产品推荐

**参数:**

- `userInput` (string): 用户输入文本
- `userId` (string, 可选): 用户ID，默认为"user1"

#### 3. recommend_by_brand

根据品牌推荐产品

**参数:**

- `brand` (string): 品牌名称
- `limit` (number, 可选): 最大推荐结果数量，默认为5

#### 4. get_all_products

获取所有产品信息

**参数:**

- `category` (string, 可选): 产品类别筛选

#### 5. get_all_ads

获取所有广告信息

**参数:**

- `active` (boolean, 可选): 是否只返回活跃广告，默认为true

### REST API

#### 意图识别

```
POST /mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "name": "analyze_intent",
    "arguments": {
      "userInput": "牙疼怎么办？"
    }
  }
}
```

#### 获取推荐

```
POST /mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "name": "get_recommendations",
    "arguments": {
      "userInput": "想买个笔记本电脑",
      "userId": "user_001"
    }
  }
}
```

#### 获取所有产品

```
GET /mcp?method=get_all_products
```

#### 获取所有广告

```
GET /mcp?method=get_all_ads
```

## 使用示例

### 意图识别示例

```javascript
// 显式意图
输入: "哪家自行车比较好？"
输出: {
  "hasIntent": true,
  "confidence": 0.9,
  "category": "自行车",
  "intentType": "explicit",
  "relatedProducts": [...]
}

// 隐式意图
输入: "牙疼怎么办？"
输出: {
  "hasIntent": true,
  "confidence": 0.8,
  "category": "口腔护理",
  "intentType": "implicit",
  "relatedProducts": [...]
}
```

### 推荐结果示例

```javascript
{
  "intent": {
    "hasIntent": true,
    "confidence": 0.9,
    "category": "自行车"
  },
  "recommendations": {
    "success": true,
    "recommendations": [
      {
        "id": 1,
        "name": "小米电动自行车",
        "brand": "小米",
        "price": 2999,
        "description": "小米电动自行车，续航80公里，智能助力",
        "matchReason": "符合自行车类别需求; 匹配关键词: 自行车; 高评分产品",
        "confidence": 0.95
      }
    ],
    "ads": [
      {
        "id": 1,
        "title": "小米电动自行车限时优惠",
        "content": "小米电动自行车，原价3299，现价2999！",
        "bidPrice": 2.5
      }
    ]
  }
}
```

## 模拟数据

系统包含以下模拟数据：

### 产品类别

- 自行车（小米电动自行车、永久经典自行车）
- 口腔护理（云南白药牙膏、舒适达抗敏牙膏、飞利浦电动牙刷）
- 电脑（华为MateBook、联想ThinkPad）

### 意图关键词

- 自行车相关：自行车、电动车、出行、代步
- 口腔护理：牙疼、牙龈出血、口腔溃疡
- 电脑相关：笔记本、电脑、办公需要

## 开发说明

### 扩展新的意图识别

在 `src/mockData.js` 中的 `intentKeywords` 对象添加新的关键词映射：

```javascript
export const intentKeywords = {
  新关键词: {
    category: "新类别",
    relatedKeywords: ["相关词1", "相关词2"],
    confidence: 0.9,
  },
};
```

### 添加新产品

在 `src/mockData.js` 中的 `mockProducts` 数组添加新产品：

```javascript
{
  id: 8,
  name: "新产品名称",
  brand: "品牌名",
  category: "产品类别",
  price: 999,
  description: "产品描述",
  keywords: ["关键词1", "关键词2"]
}
```

### 添加新广告

在 `src/mockData.js` 中的 `mockAds` 数组添加新广告：

```javascript
{
  id: 4,
  productId: 8,
  advertiserId: "brand_official",
  title: "新产品广告标题",
  content: "广告内容描述",
  bidPrice: 2.0,
  targetKeywords: ["关键词1", "关键词2"],
  budget: 5000,
  status: "active",
  clickCount: 0,
  impressionCount: 0,
  conversionCount: 0
}
```

## 许可证

MIT License
