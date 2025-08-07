import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// 输入验证schemas
const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  email: z.string()
    .email('请输入有效的邮箱地址'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(128, '密码最多128个字符'),
  display_name: z.string()
    .max(50, '显示名称最多50个字符')
    .optional()
});

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空')
});

const updateProfileSchema = z.object({
  display_name: z.string()
    .max(50, '显示名称最多50个字符')
    .optional(),
  avatar_url: z.string()
    .url('请输入有效的头像URL')
    .optional()
});

export class AuthController {
  private userService = new UserService();

  // 用户注册
  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    const result = await this.userService.register(validatedData);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: '注册成功'
    });
  });

  // 用户登录
  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    
    const result = await this.userService.login(validatedData);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: '登录成功'
    });
  });

  // 获取当前用户信息
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const user = await this.userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  });

  // 更新用户资料
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证'
      });
    }

    const validatedData = updateProfileSchema.parse(req.body);
    
    const updatedUser = await this.userService.updateUser(req.user.userId, validatedData);

    res.json({
      success: true,
      data: updatedUser,
      message: '资料更新成功'
    });
  });

  // 验证token（用于前端检查token有效性）
  verifyToken = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '无效的token'
      });
    }

    const user = await this.userService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user
      }
    });
  });
}