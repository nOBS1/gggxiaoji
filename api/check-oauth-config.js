/**
 * Google OAuth 配置验证脚本
 * 运行此脚本检查配置是否正确
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 检查 Google OAuth 配置...\n');

let hasErrors = false;

// 检查 .dev.vars 文件
console.log('1️⃣ 检查 .dev.vars 文件');
const devVarsPath = path.join(__dirname, '.dev.vars');
if (fs.existsSync(devVarsPath)) {
  console.log('   ✅ .dev.vars 文件存在');
  const content = fs.readFileSync(devVarsPath, 'utf-8');
  
  if (content.includes('GOOGLE_CLIENT_SECRET=GOCSPX-')) {
    console.log('   ✅ GOOGLE_CLIENT_SECRET 已配置');
  } else {
    console.log('   ❌ GOOGLE_CLIENT_SECRET 未配置或格式错误');
    hasErrors = true;
  }
  
  if (content.includes('SUPABASE_ANON_KEY=')) {
    console.log('   ✅ SUPABASE_ANON_KEY 已配置');
  } else {
    console.log('   ❌ SUPABASE_ANON_KEY 未配置');
    hasErrors = true;
  }
  
  if (content.includes('JWT_SECRET=')) {
    console.log('   ✅ JWT_SECRET 已配置');
  } else {
    console.log('   ❌ JWT_SECRET 未配置');
    hasErrors = true;
  }
} else {
  console.log('   ❌ .dev.vars 文件不存在');
  hasErrors = true;
}

console.log('');

// 检查 wrangler.toml 文件
console.log('2️⃣ 检查 wrangler.toml 文件');
const wranglerPath = path.join(__dirname, 'wrangler.toml');
if (fs.existsSync(wranglerPath)) {
  console.log('   ✅ wrangler.toml 文件存在');
  const content = fs.readFileSync(wranglerPath, 'utf-8');
  
  if (content.includes('GOOGLE_CLIENT_ID = "874826851840-')) {
    console.log('   ✅ GOOGLE_CLIENT_ID 已配置');
  } else {
    console.log('   ❌ GOOGLE_CLIENT_ID 未配置或格式错误');
    hasErrors = true;
  }
  
  if (content.includes('GOOGLE_REDIRECT_URI')) {
    console.log('   ✅ GOOGLE_REDIRECT_URI 已配置');
  } else {
    console.log('   ❌ GOOGLE_REDIRECT_URI 未配置');
    hasErrors = true;
  }
  
  if (content.includes('SUPABASE_URL')) {
    console.log('   ✅ SUPABASE_URL 已配置');
  } else {
    console.log('   ❌ SUPABASE_URL 未配置');
    hasErrors = true;
  }
} else {
  console.log('   ❌ wrangler.toml 文件不存在');
  hasErrors = true;
}

console.log('');

// 检查环境变量是否加载
console.log('3️⃣ 检查环境变量加载');

if (process.env.GOOGLE_CLIENT_SECRET) {
  console.log('   ✅ GOOGLE_CLIENT_SECRET 环境变量已加载');
  console.log(`   📝 值: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 15)}...`);
} else {
  console.log('   ⚠️  GOOGLE_CLIENT_SECRET 环境变量未加载');
  console.log('   💡 提示: 需要先运行 npm run dev 或 wrangler dev');
}

if (process.env.SUPABASE_ANON_KEY) {
  console.log('   ✅ SUPABASE_ANON_KEY 环境变量已加载');
} else {
  console.log('   ⚠️  SUPABASE_ANON_KEY 环境变量未加载');
}

if (process.env.JWT_SECRET) {
  console.log('   ✅ JWT_SECRET 环境变量已加载');
} else {
  console.log('   ⚠️  JWT_SECRET 环境变量未加载');
}

console.log('');

// 检查 OAuth 路由文件
console.log('4️⃣ 检查 OAuth 路由文件');
const oauthRoutePath = path.join(__dirname, 'src', 'routes', 'oauth.ts');
if (fs.existsSync(oauthRoutePath)) {
  console.log('   ✅ oauth.ts 文件存在');
} else {
  console.log('   ❌ oauth.ts 文件不存在');
  hasErrors = true;
}

console.log('');

// 检查前端配置
console.log('5️⃣ 检查前端配置');
const configPath = path.join(__dirname, '..', 'src', 'js', 'config.js');
if (fs.existsSync(configPath)) {
  console.log('   ✅ config.js 文件存在');
  const content = fs.readFileSync(configPath, 'utf-8');
  
  if (content.includes('OAUTH') && content.includes('GOOGLE')) {
    console.log('   ✅ OAuth 配置已添加到前端');
  } else {
    console.log('   ❌ OAuth 配置未添加到前端');
    hasErrors = true;
  }
} else {
  console.log('   ❌ config.js 文件不存在');
  hasErrors = true;
}

console.log('');
console.log('═'.repeat(60));

if (hasErrors) {
  console.log('❌ 发现配置错误！请检查上述问题。\n');
  console.log('📖 查看详细配置指南:');
  console.log('   - GOOGLE_OAUTH_CONFIG_STEPS.md');
  console.log('   - CLOUDFLARE_GOOGLE_OAUTH_GUIDE.md\n');
  process.exit(1);
} else {
  console.log('✅ 所有配置检查通过！\n');
  console.log('🚀 下一步：');
  console.log('   1. 在 Google Console 添加回调 URI:');
  console.log('      http://localhost:8787/api/auth/google/callback');
  console.log('');
  console.log('   2. 启动后端服务器:');
  console.log('      npm run dev');
  console.log('');
  console.log('   3. 启动前端服务器 (新窗口):');
  console.log('      cd .. && npm run dev');
  console.log('');
  console.log('   4. 访问 http://localhost:5173 测试 Google 登录');
  console.log('');
  process.exit(0);
}
