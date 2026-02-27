// ==================== 本地开发服务器 ====================
// 使用 Node.js 和 Hono 运行本地服务器

import { serve } from '@hono/node-server';
import 'dotenv/config';
import app from './src/index';

const port = parseInt(process.env.PORT || '8787');

console.log(`🚀 启动服务器在端口 ${port}...`);
console.log(`📍 API 地址: http://localhost:${port}`);
console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL}`);

serve({
  fetch: app.fetch,
  port,
});
