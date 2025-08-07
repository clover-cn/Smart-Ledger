import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, executeWithRetry } from '../config/database.js';
import { config } from '../config/index.js';
import { 
  User, 
  UserCreateInput, 
  UserLoginInput, 
  UserResponse, 
  JwtPayload 
} from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserService {
  // 生成唯一用户ID
  private generateUserId(): string {
    return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 用户注册
  async register(userData: UserCreateInput): Promise<{ user: UserResponse; token: string }> {
    const { username, email, password, display_name } = userData;

    // 检查用户是否已存在（使用重试机制）
    const [existing] = await executeWithRetry(async () => {
      return await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
    });

    if ((existing as RowDataPacket[]).length > 0) {
      throw new Error('用户名或邮箱已存在');
    }

    // 密码加密
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 生成用户ID
    const userId = this.generateUserId();

    // 插入用户数据（使用重试机制）
    await executeWithRetry(async () => {
      return await pool.execute(
        `INSERT INTO users (id, username, email, password_hash, display_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, username, email, password_hash, display_name || username]
      );
    });

    // 获取完整用户信息（使用重试机制）
    const [userRows] = await executeWithRetry(async () => {
      return await pool.execute(
        `SELECT id, username, email, display_name, avatar_url, created_at, updated_at
         FROM users WHERE id = ?`,
        [userId]
      );
    });

    const user = (userRows as RowDataPacket[])[0] as UserResponse;

    // 生成JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  // 用户登录
  async login(loginData: UserLoginInput): Promise<{ user: UserResponse; token: string }> {
    const { email, password } = loginData;

    // 查找用户（使用重试机制）
    const [userRows] = await executeWithRetry(async () => {
      return await pool.execute(
        `SELECT id, username, email, password_hash, display_name, avatar_url,
                created_at, updated_at, is_active
         FROM users WHERE email = ?`,
        [email]
      );
    });

    const users = userRows as RowDataPacket[];
    if (users.length === 0) {
      throw new Error('邮箱或密码错误');
    }

    const user = users[0] as User;

    // 检查用户是否激活
    if (!user.is_active) {
      throw new Error('账户已被禁用');
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('邮箱或密码错误');
    }

    // 返回用户信息（不包含密码）
    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    // 生成JWT token
    const token = this.generateToken(userResponse);

    return { user: userResponse, token };
  }

  // 根据ID获取用户信息
  async getUserById(userId: string): Promise<UserResponse | null> {
    const [rows] = await executeWithRetry(async () => {
      return await pool.execute(
        `SELECT id, username, email, display_name, avatar_url, created_at, updated_at
         FROM users WHERE id = ? AND is_active = true`,
        [userId]
      );
    });

    const users = rows as RowDataPacket[];
    return users.length > 0 ? (users[0] as UserResponse) : null;
  }

  // 更新用户信息
  async updateUser(userId: string, updateData: Partial<UserResponse>): Promise<UserResponse> {
    const allowedFields = ['display_name', 'avatar_url'];
    const updates: string[] = [];
    const values: any[] = [];

    // 构建更新语句
    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      throw new Error('没有可更新的字段');
    }

    values.push(userId);

    // 执行更新（使用重试机制）
    await executeWithRetry(async () => {
      return await pool.execute(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    });

    // 返回更新后的用户信息
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) {
      throw new Error('用户不存在');
    }

    return updatedUser;
  }

  // 生成JWT token
  private generateToken(user: UserResponse): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);
  }

  // 验证token
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }
}