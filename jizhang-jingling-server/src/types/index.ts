// 用户相关类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

// 交易记录相关类型定义
export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  tags: string[];
  transaction_date: string; // YYYY-MM-DD格式
  created_at: Date;
  updated_at: Date;
}

export interface TransactionCreateInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  tags?: string[];
  transaction_date?: string; // 默认为今天
}

export interface TransactionUpdateInput {
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  description?: string;
  tags?: string[];
  transaction_date?: string;
}

export interface TransactionQuery {
  type?: 'income' | 'expense';
  category?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  tags?: string[];
}

// 分类相关类型定义
export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryCreateInput {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  sort_order?: number;
}

// 会话相关类型定义
export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date;
  user_agent?: string;
  ip_address?: string;
}

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

// JWT负载类型定义
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

// 统计数据类型定义
export interface MonthlyStats {
  month: string; // YYYY-MM格式
  income: number;
  expense: number;
  balance: number;
  transaction_count: number;
}

export interface CategoryStats {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  total_balance: number;
  month_income: number;
  month_expense: number;
  month_balance: number;
  recent_transactions: Transaction[];
  top_expense_categories: CategoryStats[];
  monthly_trend: MonthlyStats[];
}