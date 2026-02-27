// Game backend API entry point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';

import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import gameRoutes from './routes/game';
import marketRoutes from './routes/market';
import profileRoutes from './routes/profile';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
  CORS_ORIGIN?: string;
  FRONTEND_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}

// Keep a set of fallback values for local Node execution
const fallbackEnv: Partial<Env> = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

const app = new Hono<{ Bindings: Env }>();

// Ensure Worker bindings always win; fall back to process.env only when missing
app.use('*', async (c, next) => {
  c.env.SUPABASE_URL = c.env.SUPABASE_URL || fallbackEnv.SUPABASE_URL || '';
  c.env.SUPABASE_ANON_KEY = c.env.SUPABASE_ANON_KEY || fallbackEnv.SUPABASE_ANON_KEY || '';
  c.env.JWT_SECRET = c.env.JWT_SECRET || fallbackEnv.JWT_SECRET || 'default-secret-key';
  c.env.NODE_ENV = c.env.NODE_ENV || fallbackEnv.NODE_ENV || 'development';
  c.env.CORS_ORIGIN = c.env.CORS_ORIGIN || fallbackEnv.CORS_ORIGIN;
  c.env.FRONTEND_URL = c.env.FRONTEND_URL || fallbackEnv.FRONTEND_URL;
  c.env.GOOGLE_CLIENT_ID = c.env.GOOGLE_CLIENT_ID || fallbackEnv.GOOGLE_CLIENT_ID;
  c.env.GOOGLE_CLIENT_SECRET = c.env.GOOGLE_CLIENT_SECRET || fallbackEnv.GOOGLE_CLIENT_SECRET;
  c.env.GOOGLE_REDIRECT_URI = c.env.GOOGLE_REDIRECT_URI || fallbackEnv.GOOGLE_REDIRECT_URI;
  await next();
});

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

const parseOrigins = (raw?: string): string[] => {
  if (!raw) return defaultOrigins;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// Global middleware
app.use('*', cors((c) => {
  const origins = parseOrigins(c.env.CORS_ORIGIN);
  const allowAny = origins.includes('*');
  const whitelist = new Set(origins.filter((item) => item !== '*'));

  return {
    origin: (requestOrigin) => {
      if (allowAny) {
        return requestOrigin ?? '*';
      }
      if (!requestOrigin) {
        return origins[0] ?? undefined;
      }
      return whitelist.has(requestOrigin) ? requestOrigin : origins[0] ?? undefined;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 600,
  };
}));

app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

// Public routes
app.route('/api/auth', authRoutes);
app.route('/api/auth', oauthRoutes);

// Protected routes (with exceptions for market browsing)
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  
  // Allow anonymous access to market browsing endpoints
  if (path === '/api/market/orders' || path === '/api/market/stats') {
    return next();
  }
  
  // All other routes require authentication
  return authMiddleware(c, next);
});

app.route('/api/game', gameRoutes);
app.route('/api/market', marketRoutes);
app.route('/api/profile', profileRoutes);

// 404 handler
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
    404,
  );
});

app.onError(errorHandler);

export default app;
