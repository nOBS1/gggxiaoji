// ==================== JWT 认证中间件 ====================
// 验证用户身份，保护 API 路由

import { Context, Next } from 'hono';
import { Env } from '../index';
import { Errors } from './errorHandler';
import * as jose from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// 扩展 Context 类型，添加用户信息
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export const authMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Errors.UNAUTHORIZED;
  }

  const token = authHeader.substring(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // 设置用户信息到上下文
    c.set('user', payload as JWTPayload);

    await next();
  } catch (error) {
    console.error('[Auth Error]', error);
    throw Errors.INVALID_TOKEN;
  }
};

// ==================== JWT 工具函数 ====================

export const generateToken = async (payload: JWTPayload, secret: string): Promise<string> => {
  const secretKey = new TextEncoder().encode(secret);
  
  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token 7天有效期
    .sign(secretKey);

  return token;
};

export const verifyToken = async (token: string, secret: string): Promise<JWTPayload | null> => {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch {
    return null;
  }
};
