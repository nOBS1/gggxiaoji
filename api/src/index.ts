// ==================== 游戏后端 API 入口文件 ====================
// 支持中英文国际化
// 使用 Supabase PostgreSQL 数据库

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';

// 路由
import authRoutes from './routes/auth';
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
  // 直接将 env 对象设置到 c.env
  Object.assign(c.env || {}, env);
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
