# OAuth 第三方登录配置指南

**项目**: 小鸡生蛋游戏  
**日期**: 2025-10-12

---

## 📍 当前状态

目前项目中的 **Google 和 GitHub 登录按钮已存在**，但功能尚未实现（点击会显示"即将上线"提示）。

要启用第三方登录，需要配置 OAuth 参数。

---

## 🔧 配置位置

### 1. 环境变量配置文件

#### 📁 `api/.env` (需要创建)

```env
# Supabase 配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth 配置
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback

# 微信 OAuth 配置
WECHAT_APP_ID=your_wechat_app_id_here
WECHAT_APP_SECRET=your_wechat_app_secret_here
WECHAT_REDIRECT_URI=http://localhost:8787/api/auth/wechat/callback

# GitHub OAuth 配置（可选）
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:8787/api/auth/github/callback

# 环境
NODE_ENV=development
```

**注意**: `.env` 文件包含敏感信息，已在 `.gitignore` 中排除，不会提交到代码库。

---

### 2. Cloudflare Workers 配置

#### 📁 `api/wrangler.toml`

在 `[vars]` 部分添加（生产环境）：

```toml
[vars]
JWT_SECRET = "your-secret-key-here-change-in-production"
API_VERSION = "v1"
CORS_ORIGIN = "https://yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID = "your_google_client_id"
GOOGLE_REDIRECT_URI = "https://your-api.workers.dev/api/auth/google/callback"

# 微信 OAuth
WECHAT_APP_ID = "your_wechat_app_id"
WECHAT_REDIRECT_URI = "https://your-api.workers.dev/api/auth/wechat/callback"

# GitHub OAuth
GITHUB_CLIENT_ID = "your_github_client_id"
GITHUB_REDIRECT_URI = "https://your-api.workers.dev/api/auth/github/callback"
```

**密钥配置** (使用 Cloudflare Secrets):

```bash
# 生产环境密钥（不要写在 wrangler.toml 中）
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put WECHAT_APP_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
```

---

### 3. 前端配置

#### 📁 `src/js/config.js`

添加 OAuth 配置：

```javascript
export const CONFIG = {
  // ... 现有配置 ...
  
  // OAuth 配置
  OAUTH: {
    GOOGLE: {
      CLIENT_ID: 'your_google_client_id_here.apps.googleusercontent.com',
      REDIRECT_URI: 'http://localhost:8787/api/auth/google/callback',
      SCOPE: 'openid email profile'
    },
    WECHAT: {
      APP_ID: 'your_wechat_app_id_here',
      REDIRECT_URI: 'http://localhost:8787/api/auth/wechat/callback',
      SCOPE: 'snsapi_login',
      STATE: 'random_state_string'
    },
    GITHUB: {
      CLIENT_ID: 'your_github_client_id_here',
      REDIRECT_URI: 'http://localhost:8787/api/auth/github/callback',
      SCOPE: 'read:user user:email'
    }
  }
};
```

---

## 🔑 获取 OAuth 凭证

### 1. Google OAuth 2.0

#### 步骤：

1. **访问 Google Cloud Console**
   - https://console.cloud.google.com/

2. **创建项目**
   - 点击 "选择项目" → "新建项目"
   - 项目名称: "小鸡生蛋游戏"

3. **启用 Google+ API**
   - APIs & Services → Library
   - 搜索 "Google+ API" 并启用

4. **创建 OAuth 2.0 凭据**
   - APIs & Services → Credentials
   - 创建凭据 → OAuth 客户端 ID
   - 应用类型: Web 应用
   - 授权重定向 URI:
     ```
     http://localhost:8787/api/auth/google/callback  (开发)
     https://your-api.workers.dev/api/auth/google/callback  (生产)
     ```

5. **获取凭据**
   - 客户端 ID: `xxxxx.apps.googleusercontent.com`
   - 客户端密钥: `GOCSPX-xxxxxx`

---

### 2. 微信开放平台

#### 步骤：

1. **注册微信开放平台账号**
   - https://open.weixin.qq.com/

2. **创建网站应用**
   - 管理中心 → 网站应用 → 创建网站应用
   - 填写应用信息
   - 审核通过后获取 AppID 和 AppSecret

3. **配置回调域名**
   - 授权回调域名: 
     ```
     localhost:8787  (开发，需要内网穿透)
     your-domain.com  (生产)
     ```

4. **获取凭据**
   - AppID: `wx1234567890abcdef`
   - AppSecret: `1234567890abcdef1234567890abcdef`

**注意**: 微信登录需要备案域名，开发环境需要使用内网穿透工具（如 ngrok）。

---

### 3. GitHub OAuth

#### 步骤：

1. **访问 GitHub Settings**
   - https://github.com/settings/developers

2. **创建 OAuth App**
   - Developer settings → OAuth Apps → New OAuth App
   - Application name: "小鸡生蛋游戏"
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL:
     ```
     http://localhost:8787/api/auth/github/callback  (开发)
     https://your-api.workers.dev/api/auth/github/callback  (生产)
     ```

3. **获取凭据**
   - Client ID: `Iv1.1234567890abcdef`
   - Client Secret: (生成并保存)

---

## 💻 实现代码

### 1. 后端 API 路由

#### 📁 `api/src/routes/oauth.ts` (需要创建)

```typescript
import { Hono } from 'hono';
import { Env } from '../index';

const oauth = new Hono<{ Bindings: Env }>();

// Google OAuth 登录
oauth.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = c.env.GOOGLE_REDIRECT_URI;
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid email profile`;
  
  return c.redirect(authUrl);
});

// Google OAuth 回调
oauth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  
  if (!code) {
    return c.json({ success: false, error: 'No code provided' }, 400);
  }
  
  // 交换 code 获取 access_token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const tokens = await tokenResponse.json();
  
  // 获取用户信息
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  
  const userInfo = await userResponse.json();
  
  // TODO: 创建或登录用户，生成 JWT
  
  return c.json({ success: true, user: userInfo });
});

// 微信 OAuth 登录
oauth.get('/wechat', async (c) => {
  const appId = c.env.WECHAT_APP_ID;
  const redirectUri = c.env.WECHAT_REDIRECT_URI;
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?` +
    `appid=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=snsapi_login&` +
    `state=${state}#wechat_redirect`;
  
  return c.redirect(authUrl);
});

// 微信 OAuth 回调
oauth.get('/wechat/callback', async (c) => {
  const code = c.req.query('code');
  
  if (!code) {
    return c.json({ success: false, error: 'No code provided' }, 400);
  }
  
  // 获取 access_token
  const tokenResponse = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?` +
    `appid=${c.env.WECHAT_APP_ID}&` +
    `secret=${c.env.WECHAT_APP_SECRET}&` +
    `code=${code}&` +
    `grant_type=authorization_code`
  );
  
  const tokens = await tokenResponse.json();
  
  // 获取用户信息
  const userResponse = await fetch(
    `https://api.weixin.qq.com/sns/userinfo?` +
    `access_token=${tokens.access_token}&` +
    `openid=${tokens.openid}`
  );
  
  const userInfo = await userResponse.json();
  
  // TODO: 创建或登录用户，生成 JWT
  
  return c.json({ success: true, user: userInfo });
});

export default oauth;
```

---

### 2. 前端 OAuth 处理

#### 📁 `src/js/auth.js` 更新

```javascript
// 更新 Google 登录按钮事件
document.getElementById('googleLoginBtn').addEventListener('click', () => {
  const authUrl = `${CONFIG.API_BASE_URL}/auth/google`;
  window.location.href = authUrl;
});

// 更新微信登录按钮事件
document.getElementById('wechatLoginBtn').addEventListener('click', () => {
  const authUrl = `${CONFIG.API_BASE_URL}/auth/wechat`;
  window.location.href = authUrl;
});

// 更新 GitHub 登录按钮事件
document.getElementById('githubLoginBtn').addEventListener('click', () => {
  const authUrl = `${CONFIG.API_BASE_URL}/auth/github`;
  window.location.href = authUrl;
});
```

---

## 📝 检查清单

配置第三方登录前，请确保完成以下步骤：

- [ ] 在对应平台创建应用并获取凭据
- [ ] 配置 `.env` 文件（本地开发）
- [ ] 配置 `wrangler.toml`（生产环境）
- [ ] 使用 `wrangler secret` 设置密钥
- [ ] 创建 OAuth 路由文件
- [ ] 更新前端按钮事件处理
- [ ] 配置回调 URI（开发和生产）
- [ ] 测试 OAuth 流程

---

## 🔒 安全建议

1. **永远不要将密钥提交到代码库**
   - 使用 `.env` 文件并加入 `.gitignore`
   - 生产环境使用 Cloudflare Secrets

2. **验证 state 参数**
   - 防止 CSRF 攻击

3. **使用 HTTPS**
   - 生产环境必须使用 HTTPS

4. **限制回调 URI**
   - 只添加需要的回调地址

5. **定期轮换密钥**
   - 定期更新 OAuth 密钥

---

## 🆘 常见问题

### Q: 微信登录无法在本地测试？
A: 微信要求备案域名，本地开发需要使用内网穿透工具（如 ngrok）。

### Q: Google 登录提示 redirect_uri_mismatch？
A: 检查 Google Console 中配置的回调 URI 是否与代码中完全一致。

### Q: 如何获取用户邮箱？
A: 确保 OAuth scope 包含 `email`，并在回调中解析用户信息。

---

## 📞 技术支持

如有问题，请查看：
- Google OAuth 文档: https://developers.google.com/identity/protocols/oauth2
- 微信开放平台: https://developers.weixin.qq.com/doc/
- GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps

**最后更新**: 2025-10-12
