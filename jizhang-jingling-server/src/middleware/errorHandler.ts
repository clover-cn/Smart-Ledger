import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 默认错误信息
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';

  // Zod验证错误
  if (err instanceof ZodError) {
    statusCode = 400;
    message = '请求参数验证失败';
    const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: errors
    });
  }

  // 数据库连接错误处理
  if (err.message.includes('ECONNRESET') || err.message.includes('read ECONNRESET')) {
    statusCode = 503;
    message = '数据库连接中断，请稍后重试';
  } else if (err.message.includes('PROTOCOL_CONNECTION_LOST')) {
    statusCode = 503;
    message = '数据库连接丢失，请稍后重试';
  } else if (err.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = '无法连接到数据库服务器';
  } else if (err.message.includes('ETIMEDOUT') || err.message.includes('connect ETIMEDOUT')) {
    statusCode = 503;
    message = '数据库连接超时，请稍后重试';
  } else if (err.message.includes('ER_DUP_ENTRY')) {
    statusCode = 409;
    message = '数据已存在，请检查用户名或邮箱';
  } else if (err.message.includes('ER_NO_REFERENCED_ROW')) {
    statusCode = 400;
    message = '关联数据不存在';
  } else if (err.message.includes('ER_ACCESS_DENIED')) {
    statusCode = 503;
    message = '数据库访问被拒绝';
  } else if (err.message.includes('ER_BAD_DB_ERROR')) {
    statusCode = 503;
    message = '数据库不存在';
  }

  // 记录错误日志
  if (statusCode >= 500) {
    console.error('服务器错误:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      user: req.user?.userId
    });
  } else {
    console.warn('客户端错误:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.userId
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// 404错误处理
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在'
  });
}

// 异步错误捕获包装器
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}