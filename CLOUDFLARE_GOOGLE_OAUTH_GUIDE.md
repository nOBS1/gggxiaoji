# Cloudflare Workers + Google OAuth 部署指南

**项目**: 小鸡生蛋游戏 v3.0  
**更新日期**: 2025-10-14

---

## 📋 目录

1. [概述](#概述)
2. [Google OAuth 配置](#google-oauth-配置)
3. [Cloudflare Workers 配置](#cloudflare-workers-配置)
4. [环境变量设置](#环境变量设置)
5. [后端代码实现](#后端代码实现)
6. [前端集成](#前端集成)
7. [部署步骤](#部署步骤)
8. [测试验证](#测试验证)
9. [常见问题](#常见问题)

---

## 概述

本指南详细说明如何在 Cloudflare Workers 上部署支持 Google OAuth 登录的后端 API。

### 架构图

```
用户浏览器 → 前端 (Cloudflare Pages)
           ↓
       点击 Google 登录
           ↓
   → Google OAuth 授权页面
           ↓
       用户授权
           ↓
   → 后端 API (Cloudflare Workers) /api/auth/google/callback
           ↓
   获取 Google 用户信息
           ↓
   创建/登录账号 → Supabase PostgreSQL
           ↓
   生成 JWT Token
           ↓
   返回前端 (带 Token)
```

---

## Google OAuth 配置

### 步骤 1: 创建 Google Cloud 项目

1. **访问 Google Cloud Console**
   - 网址: https://console.cloud.google.com/

2. **创建新项目**
   - 点击顶部项目选择器
   - 点击 "新建项目"
   - 项目名称: `xiaoji-game` 或你喜欢的名称
   - 点击 "创建"

### 步骤 2: 启用 Google+ API

1. 在左侧菜单选择 **"APIs & Services" → "Library"**
2. 搜索 **"Google+ API"** 或 **"Google People API"**
3. 点击进入，然后点击 **"启用"**

### 步骤 3: 创建 OAuth 2.0 凭据

1. **配置同意屏幕** (首次需要)
   - 进入 **"APIs & Services" → "OAuth consent screen"**
   - 用户类型选择 **"外部"** (External)
   - 应用名称: `小鸡生蛋游戏`
   - 用户支持电子邮件: 你的邮箱
   - 开发者联系信息: 你的邮箱
   - 点击 **"保存并继续"**
   - 作用域 (Scopes): 选择 `.../auth/userinfo.email` 和 `.../auth/userinfo.profile`
   - 测试用户: 添加你的 Google 账号用于测试
   - 点击 **"保存并继续"**

2. **创建 OAuth 客户端 ID**
   - 进入 **"APIs & Services" → "Credentials"**
   - 点击 **"+ 创建凭据" → "OAuth 客户端 ID"**
   - 应用类型: **Web 应用**
   - 名称: `xiaoji-game-web`
   
3. **配置授权重定向 URI**
   
   添加以下 URI（根据你的部署环境）:
   
   **本地开发**:
   ```
   http://localhost:8787/api/auth/google/callback
   ```
   
   **Cloudflare Workers (生产环境)**:
   ```
   https://xiaoji-game-api.YOUR_USERNAME.workers.dev/api/auth/google/callback
   ```
   
   或者你的自定义域名:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```

4. **获取凭据**
   
   创建完成后，你会看到:
   - **客户端 ID**: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
   - **客户端密钥**: `GOCSPX-ABCdefGHIjklMNOpqrSTUvwxYZ`
   
   **重要**: 立即保存这些信息，稍后配置需要用到！

---

## Cloudflare Workers 配置

### 步骤 1: 更新 `wrangler.toml`

编辑 `api/wrangler.toml` 文件，添加 Google OAuth 相关配置:

```toml
name = "xiaoji-game-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 环境变量 (公开的，非敏感信息)
[vars]
JWT_SECRET = "your-secret-key-here-change-in-production"
API_VERSION = "v1"
CORS_ORIGIN = "https://yourdomain.com"

# Google OAuth 公开配置
GOOGLE_CLIENT_ID = "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://xiaoji-game-api.YOUR_USERNAME.workers.dev/api/auth/google/callback"

# Supabase 配置
SUPABASE_URL = "https://your-project.supabase.co"

# 生产环境配置
[env.production]
name = "xiaoji-game-api-prod"

[vars.production]
CORS_ORIGIN = "https://yourdomain.com"
GOOGLE_REDIRECT_URI = "https://api.yourdomain.com/api/auth/google/callback"

# 开发环境配置
[env.development]
name = "xiaoji-game-api-dev"

[vars.development]
CORS_ORIGIN = "*"
GOOGLE_REDIRECT_URI = "http://localhost:8787/api/auth/google/callback"

# 构建配置
[build]
command = ""

# Node.js 兼容性
[compatibility_flags]
nodejs_compat = true
```

---

## 环境变量设置

### 本地开发环境

创建 `api/.dev.vars` 文件 (Cloudflare Workers 本地开发专用):

```env
# Google OAuth 密钥 (敏感信息)
GOOGLE_CLIENT_SECRET=GOCSPX-ABCdefGHIjklMNOpqrSTUvwxYZ

# Supabase 密钥
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT 密钥
JWT_SECRET=your-local-dev-jwt-secret-key
```

**注意**: `.dev.vars` 文件应添加到 `.gitignore`，不要提交到代码仓库！

### Cloudflare 生产环境 (使用 Secrets)

**敏感信息不要写在 `wrangler.toml` 中！** 使用 Cloudflare Secrets 管理:

```bash
# 切换到 api 目录
cd api

# 设置 Google Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# 提示输入时，粘贴你的 Google Client Secret

# 设置 Supabase Anon Key
wrangler secret put SUPABASE_ANON_KEY
# 提示输入时，粘贴你的 Supabase Anon Key

# 设置 JWT Secret (生产环境用强密钥)
wrangler secret put JWT_SECRET
# 提示输入时，输入一个强随机密钥
```

**生成强随机密钥的方法**:
```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 或使用 OpenSSL
openssl rand -base64 32
```

### 验证 Secrets 配置

```bash
# 查看已设置的 secrets
wrangler secret list
```

---

## 后端代码实现

### 文件结构

```
api/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # 现有的邮箱密码认证
│   │   └── oauth.ts         # 新增: Google OAuth 路由
│   ├── utils/
│   │   └── supabase.ts      # Supabase 客户端
│   └── index.ts             # 主入口
└── wrangler.toml
```

### 创建 OAuth 路由文件

创建 `api/src/routes/oauth.ts`:

```typescript
import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import * as jose from 'jose';

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
}

const oauth = new Hono<{ Bindings: Env }>();

// Google OAuth 登录入口
oauth.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = c.env.GOOGLE_REDIRECT_URI;
  
  // 构建 Google OAuth 授权 URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'online');
  
  // 可选: 添加 state 参数防止 CSRF 攻击
  const state = crypto.randomUUID();
  authUrl.searchParams.set('state', state);
  
  return c.redirect(authUrl.toString());
});

// Google OAuth 回调处理
oauth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    
    if (!code) {
      return c.json({ 
        success: false, 
        error: 'Authorization code not provided' 
      }, 400);
    }
    
    // 1. 用 code 交换 access_token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: c.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Google token exchange failed:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to exchange authorization code' 
      }, 500);
    }
    
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    
    // 2. 用 access_token 获取用户信息
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userResponse.ok) {
      return c.json({ 
        success: false, 
        error: 'Failed to fetch user info from Google' 
      }, 500);
    }
    
    const googleUser = await userResponse.json();
    console.log('Google user info:', googleUser);
    
    // 3. 在 Supabase 中查找或创建用户
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY
    );
    
    // 查找是否已存在该邮箱的用户
    const { data: existingUsers, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .limit(1);
    
    if (findError) {
      console.error('Database query error:', findError);
      return c.json({ 
        success: false, 
        error: 'Database query failed' 
      }, 500);
    }
    
    let user;
    
    if (existingUsers && existingUsers.length > 0) {
      // 用户已存在，直接登录
      user = existingUsers[0];
      
      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          avatar_url: googleUser.picture || user.avatar_url,
        })
        .eq('id', user.id);
        
    } else {
      // 新用户，创建账号
      const newUser = {
        email: googleUser.email,
        username: googleUser.name || googleUser.email.split('@')[0],
        avatar_url: googleUser.picture || null,
        auth_provider: 'google',
        google_id: googleUser.id,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create user:', createError);
        return c.json({ 
          success: false, 
          error: 'Failed to create user account' 
        }, 500);
      }
      
      user = createdUser;
      
      // 为新用户创建初始 profile
      await supabase.from('profiles').insert([{
        user_id: user.id,
        coins: 0,
        peck_progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    }
    
    // 4. 生成 JWT Token
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new jose.SignJWT({ 
      userId: user.id,
      email: user.email,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
    
    // 5. 重定向回前端，携带 token
    const frontendUrl = new URL(c.req.header('Referer') || 'http://localhost:3000');
    frontendUrl.searchParams.set('token', token);
    frontendUrl.searchParams.set('oauth_success', 'true');
    
    return c.redirect(frontendUrl.toString());
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error during OAuth callback' 
    }, 500);
  }
});

export default oauth;
```

### 更新主入口文件

编辑 `api/src/index.ts`，注册 OAuth 路由:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import oauth from './routes/oauth';  // 新增
import game from './routes/game';
import market from './routes/market';

const app = new Hono();

// CORS 中间件
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
}));

// 路由注册
app.route('/api/auth', auth);
app.route('/api/auth', oauth);  // 新增: OAuth 路由
app.route('/api/game', game);
app.route('/api/market', market);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

---

## 前端集成

### 更新前端配置

编辑 `src/js/config.js`:

```javascript
export const CONFIG = {
  // ... 现有配置 ...
  
  // API 基础 URL
  API_BASE_URL: 'http://localhost:8787/api',  // 开发环境
  // API_BASE_URL: 'https://xiaoji-game-api.YOUR_USERNAME.workers.dev/api',  // 生产环境
  
  // OAuth 配置
  OAUTH: {
    GOOGLE: {
      ENABLED: true,
      AUTH_URL: '/auth/google',  // 相对于 API_BASE_URL
    }
  }
};
```

### 更新前端认证逻辑

编辑 `src/js/auth-simple.js`:

```javascript
import { CONFIG } from './config.js';
import { showToast } from './ui.js';

// Google 登录按钮事件
document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
  // 构建完整的 OAuth URL
  const oauthUrl = `${CONFIG.API_BASE_URL}${CONFIG.OAUTH.GOOGLE.AUTH_URL}`;
  
  // 跳转到 Google OAuth 授权页面
  window.location.href = oauthUrl;
});

document.getElementById('googleRegisterBtn')?.addEventListener('click', () => {
  // 注册和登录使用相同的 OAuth 流程
  const oauthUrl = `${CONFIG.API_BASE_URL}${CONFIG.OAUTH.GOOGLE.AUTH_URL}`;
  window.location.href = oauthUrl;
});

// OAuth 回调处理 (页面加载时检查 URL 参数)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const oauthSuccess = urlParams.get('oauth_success');
  
  if (oauthSuccess === 'true' && token) {
    // OAuth 登录成功
    
    // 1. 保存 token 到 localStorage
    localStorage.setItem('authToken', token);
    
    // 2. 解析 token 获取用户信息
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('userId', payload.userId);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('email', payload.email);
      
      // 3. 显示成功提示
      showToast('Google 登录成功！', 'success');
      
      // 4. 关闭登录模态框
      document.getElementById('authModal')?.classList.remove('active');
      
      // 5. 清理 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 6. 触发登录成功事件，更新 UI
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: { 
          userId: payload.userId,
          username: payload.username,
          email: payload.email
        } 
      }));
      
    } catch (error) {
      console.error('Failed to parse OAuth token:', error);
      showToast('登录失败，请重试', 'error');
    }
  }
});
```

### 更新 HTML (移除 "即将上线" 提示)

`index.html` 中的 Google 按钮已经存在，无需修改 HTML，只需确保按钮 ID 正确:

```html
<!-- 登录表单中 -->
<button type="button" class="oauth-btn" id="googleLoginBtn">
  <!-- SVG 图标 -->
  <span>Google</span>
</button>

<!-- 注册表单中 -->
<button type="button" class="oauth-btn" id="googleRegisterBtn">
  <!-- SVG 图标 -->
  <span>Google</span>
</button>
```

---

## 部署步骤

### 1. 本地测试

```bash
# 安装依赖
cd api
npm install

# 启动本地开发服务器
npm run dev

# 或使用 wrangler
wrangler dev
```

访问 `http://localhost:8787/api/auth/google` 测试 OAuth 流程。

### 2. 部署到 Cloudflare Workers

```bash
# 确保在 api 目录下
cd api

# 登录 Cloudflare (首次需要)
wrangler login

# 设置生产环境的 secrets
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET

# 部署到 Cloudflare Workers
wrangler deploy

# 或部署到生产环境
wrangler deploy --env production
```

部署成功后，你会看到类似输出:

```
 ⛅️ wrangler 3.100.0
-------------------
Uploaded xiaoji-game-api (1.23 MB)
Published xiaoji-game-api (2.45 sec)
  https://xiaoji-game-api.YOUR_USERNAME.workers.dev
```

### 3. 更新 Google OAuth 回调 URI

部署后，记得在 Google Cloud Console 中添加生产环境的回调 URI:

```
https://xiaoji-game-api.YOUR_USERNAME.workers.dev/api/auth/google/callback
```

### 4. 部署前端到 Cloudflare Pages

```bash
# 在项目根目录
npm run build

# 使用 wrangler 部署到 Pages
npx wrangler pages deploy dist --project-name xiaoji-game
```

或通过 Cloudflare Dashboard 连接 GitHub 仓库自动部署。

---

## 测试验证

### 测试清单

- [ ] 本地开发环境 Google OAuth 流程正常
- [ ] 点击 Google 登录跳转到 Google 授权页面
- [ ] 授权后正确回调到后端
- [ ] 后端正确获取 Google 用户信息
- [ ] 新用户自动创建账号
- [ ] 老用户直接登录
- [ ] JWT Token 正确生成并返回前端
- [ ] 前端正确保存 Token 和用户信息
- [ ] 登录后 UI 状态更新正确
- [ ] 生产环境 OAuth 流程正常

### 调试技巧

1. **查看 Cloudflare Workers 日志**
   ```bash
   wrangler tail
   ```

2. **检查浏览器控制台**
   - Network 标签查看 OAuth 请求
   - Console 标签查看错误信息

3. **测试 OAuth 流程的各个阶段**
   - 直接访问 `/api/auth/google` 查看重定向
   - 检查 Google 授权页面 URL 参数
   - 检查回调 URL 和参数

---

## 常见问题

### Q1: `redirect_uri_mismatch` 错误？

**原因**: Google Console 中配置的回调 URI 与代码中不一致。

**解决**:
1. 检查 `wrangler.toml` 中 `GOOGLE_REDIRECT_URI` 的值
2. 确保 Google Console 中已添加完全相同的 URI (包括协议、域名、端口、路径)

### Q2: 本地开发时 Google OAuth 无法回调？

**原因**: Google OAuth 默认要求 HTTPS，但本地开发使用 HTTP。

**解决**:
- `localhost` 是特例，允许使用 HTTP
- 确保使用 `http://localhost:8787` 而不是 `http://127.0.0.1:8787`
- 在 Google Console 中明确添加 `http://localhost:8787/api/auth/google/callback`

### Q3: Token 解析失败？

**原因**: JWT_SECRET 不一致或 Token 格式错误。

**解决**:
- 确保前端和后端使用相同的 JWT_SECRET
- 检查后端生成 Token 的逻辑
- 前端解析 Token 使用 `JSON.parse(atob(token.split('.')[1]))`

### Q4: CORS 错误？

**原因**: 后端未正确配置 CORS。

**解决**:
在 `api/src/index.ts` 中正确配置 CORS:

```typescript
app.use('/*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com'
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

### Q5: Supabase 数据库连接失败？

**原因**: 环境变量未正确配置。

**解决**:
1. 检查 `.dev.vars` (本地) 和 Cloudflare Secrets (生产) 中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
2. 确保 Supabase 项目存在且可访问
3. 检查 `users` 和 `profiles` 表结构是否正确

### Q6: 用户创建失败，提示权限不足？

**原因**: Supabase Row Level Security (RLS) 策略限制。

**解决**:
开发阶段可以临时禁用 RLS:

```sql
-- 在 Supabase SQL Editor 中执行
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

生产环境应配置正确的 RLS 策略。

### Q7: 部署后 OAuth 不工作？

**检查清单**:
- [ ] Cloudflare Secrets 是否正确设置 (使用 `wrangler secret list` 检查)
- [ ] `wrangler.toml` 中 `GOOGLE_CLIENT_ID` 和 `GOOGLE_REDIRECT_URI` 是否正确
- [ ] Google Console 中是否添加了生产环境的回调 URI
- [ ] 前端 `CONFIG.API_BASE_URL` 是否指向正确的 Workers 地址
- [ ] CORS 配置是否包含前端域名

---

## 安全建议

1. **永远不要提交敏感信息到代码仓库**
   - `.dev.vars` 和 `.env` 文件应在 `.gitignore` 中
   - 生产环境使用 Cloudflare Secrets

2. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - Cloudflare Workers 默认提供 HTTPS

3. **验证 OAuth State 参数**
   - 防止 CSRF 攻击
   - 代码示例中已包含 `state` 参数

4. **限制 JWT 有效期**
   - 建议 7 天或更短
   - 代码中设置为 `7d`

5. **定期轮换密钥**
   - 定期更新 `JWT_SECRET` 和 Google Client Secret

6. **配置 Supabase RLS**
   - 生产环境必须启用 Row Level Security
   - 限制用户只能访问自己的数据

---

## 后续优化

1. **支持更多 OAuth 提供商**
   - GitHub
   - 微信
   - Apple

2. **实现账号绑定**
   - 允许用户绑定多个 OAuth 账号

3. **OAuth 登录状态持久化**
   - 使用 Refresh Token 自动刷新

4. **用户资料完善**
   - OAuth 登录后引导用户完善资料

---

## 参考文档

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架文档](https://hono.dev/)
- [Supabase 文档](https://supabase.com/docs)

---

**最后更新**: 2025-10-14  
**版本**: v3.0  
**作者**: Xiaoji Game Team
