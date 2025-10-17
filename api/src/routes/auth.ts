// ==================== 认证路由 ====================
// 注册、登录、Token刷新
// 使用 Supabase PostgreSQL

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { getSupabase } from '../lib/supabase';

const auth = new Hono<{ Bindings: Env }>();

// ==================== POST /api/auth/register ====================
// 用户注册

auth.post('/register', async (c) => {
  const { email, password } = await c.req.json();

  // 验证输入
  if (!email || !password) {
    throw Errors.MISSING_FIELDS;
  }

  if (!email.includes('@') || password.length < 6) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const env = {
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: c.env.SUPABASE_ANON_KEY,
      JWT_SECRET: c.env.JWT_SECRET,
      NODE_ENV: c.env.NODE_ENV || 'development',
    };
    const supabase = getSupabase(env);
    
    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw Errors.EMAIL_EXISTS;
    }

    // 创建新用户
    const hashedPassword = await hashPassword(password);
    const username = email.split('@')[0];
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        hashed_password: hashedPassword,
        username,
        auth_provider: 'local'
      }])
      .select('id, email')
      .single();

    if (error || !newUser) {
      console.error('User creation error:', error);
      throw Errors.DATABASE_ERROR;
    }

    // 生成 JWT Token
    const token = await generateToken({ userId: newUser.id, email: newUser.email }, env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/auth/login ====================
// 用户登录

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  // 验证输入
  if (!email || !password) {
    throw Errors.MISSING_FIELDS;
  }

  try {
    const env = {
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: c.env.SUPABASE_ANON_KEY,
      JWT_SECRET: c.env.JWT_SECRET,
      NODE_ENV: c.env.NODE_ENV || 'development',
    };
    const supabase = getSupabase(env);
    
    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, hashed_password, auth_provider')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw Errors.INVALID_CREDENTIALS;
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.hashed_password);
    if (!isValidPassword) {
      throw Errors.INVALID_CREDENTIALS;
    }

    // 更新最后登录时间
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        auth_provider: user.auth_provider || 'local'
      })
      .eq('id', user.id);

    // 生成 JWT Token
    const token = await generateToken({ userId: user.id, email: user.email }, env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== GET /api/auth/verify ====================
// 验证 Token 有效性（可选）

auth.get('/verify', async (c) => {
  // 由于这是公开路由，需要手动解析 Token
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Errors.UNAUTHORIZED;
  }

  const token = authHeader.substring(7);

  try {
    const { verifyToken } = await import('../middleware/auth');
    const jwtSecret = process.env.JWT_SECRET || '';
    const payload = await verifyToken(token, jwtSecret);

    if (!payload) {
      throw Errors.INVALID_TOKEN;
    }

    return c.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
      },
    });
  } catch (error) {
    throw Errors.INVALID_TOKEN;
  }
});

export default auth;
