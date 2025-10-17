// ==================== 游戏后端 API 入口文件 ====================
// 支持中英文国际化
// 使用 Supabase PostgreSQL 数据库

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';

// 路由
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';  // 新增: Google OAuth 路由
import gameRoutes from './routes/game';
import marketRoutes from './routes/market';
import profileRoutes from './routes/profile';

// 中间件
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// 类型定义
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
  // Google OAuth 配置
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}

// 初始化环境变量
const env: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 将环境变量注入到上下文
app.use('*', async (c, next) => {
  // 确保 c.env 存在并包含所有环境变量
  if (!c.env) {
    c.env = {} as Env;
  }
  // 注入所有环境变量
  c.env.SUPABASE_URL = env.SUPABASE_URL;
  c.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
  c.env.JWT_SECRET = env.JWT_SECRET;
  c.env.NODE_ENV = env.NODE_ENV;
  // 注入 Google OAuth 配置
  c.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  c.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  c.env.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';
  await next();
});

// ==================== 全局中间件 ====================

// CORS 配置 (支持前端跨域请求)
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:5173',  // Vite 默认端口
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ], // 开发环境
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600, // 预检请求缓存10分钟
}));

// 日志记录
app.use('*', logger());

// ==================== 健康检查 ====================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

// ==================== API 路由 ====================

// 公开路由 (无需认证)
app.route('/api/auth', authRoutes);
app.route('/api/auth', oauthRoutes);  // 新增: Google OAuth 路由

// 受保护路由 (需要认证)
app.use('/api/*', authMiddleware);
app.route('/api/game', gameRoutes);
app.route('/api/market', marketRoutes);
app.route('/api/profile', profileRoutes);

// ==================== 404 处理 ====================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: c.req.header('Accept-Language')?.startsWith('zh') 
          ? '请求的资源未找到' 
          : 'The requested resource was not found',
      },
    },
    404
  );
});

// ==================== 错误处理 ====================

app.onError(errorHandler);

// ==================== 导出 ====================

export default app;
