# 记账精灵后台服务器

记账精灵项目的后台API服务器，提供用户认证和交易记录管理功能。

## 功能特性

- 🔐 用户注册和登录
- 🔑 JWT身份验证
- 💰 交易记录CRUD操作
- 📊 Dashboard统计数据
- 🏷️ 支持交易标签和分类
- 📱 为MCP服务器和小程序提供API

## 技术栈

- **后端框架**: Express.js + TypeScript
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcryptjs
- **验证**: Zod
- **其他**: CORS, Helmet, 等

## 快速开始

### 1. 环境要求

- Node.js 18+
- MySQL 8.0+
- pnpm (推荐)

### 2. 安装依赖

```bash
cd jizhang-jingling-server
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接和JWT密钥：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jizhang_jingling

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 4. 创建数据库

```sql
CREATE DATABASE jizhang_jingling CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 运行数据库迁移

```bash
pnpm run db:migrate
```

### 6. 启动服务器

```bash
# 开发模式
pnpm run dev

# 生产模式
pnpm run build
pnpm start
```

## API文档

### 认证接口

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "display_name": "测试用户"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com", 
  "password": "password123"
}
```

#### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### 交易记录接口

#### 创建交易记录
```http
POST /api/transactions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 50.00,
  "category": "餐饮",
  "description": "午餐",
  "tags": ["日常开销"],
  "transaction_date": "2025-08-07"
}
```

#### 获取交易记录列表
```http
GET /api/transactions?page=1&limit=20&type=expense&start_date=2025-08-01&end_date=2025-08-31
Authorization: Bearer <jwt_token>
```

#### 获取Dashboard数据
```http
GET /api/transactions/dashboard
Authorization: Bearer <jwt_token>
```

## 数据库表结构

### users 表
- `id`: 用户唯一标识
- `username`: 用户名
- `email`: 邮箱
- `password_hash`: 加密密码
- `display_name`: 显示名称
- `created_at`, `updated_at`: 时间戳

### transactions 表  
- `id`: 交易记录唯一标识
- `user_id`: 关联用户ID
- `type`: 交易类型(income/expense)
- `amount`: 金额
- `category`: 分类
- `description`: 描述
- `tags`: JSON格式标签
- `transaction_date`: 交易日期
- `created_at`, `updated_at`: 时间戳

### categories 表
- 预定义和用户自定义分类

## 开发指南

### 项目结构
```
src/
├── config/          # 配置文件
├── controllers/     # 控制器层
├── middleware/      # 中间件
├── routes/          # 路由层
├── services/        # 业务逻辑层
├── types/           # TypeScript类型定义
└── database/        # 数据库相关
```

### 添加新功能

1. 在 `types/` 中定义类型
2. 在 `services/` 中实现业务逻辑
3. 在 `controllers/` 中添加控制器
4. 在 `routes/` 中添加路由
5. 更新 `app.ts` 注册路由

## 部署

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 构建项目
pnpm run build

# 启动服务
pm2 start dist/app.js --name jizhang-server

# 查看状态
pm2 status
```

### 使用Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 许可证

MIT License