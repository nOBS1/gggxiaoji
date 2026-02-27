# Google OAuth 500 错误修复指南

## 🔴 问题现象

访问 `https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google` 返回：
```json
{
  "success": false,
  "error": "Google OAuth is not configured properly"
}
```

## 🔍 问题原因

Cloudflare Workers 的环境变量 `GOOGLE_CLIENT_ID` 和 `GOOGLE_REDIRECT_URI` 在运行时无法正确读取。

代码中使用了：
```typescript
const clientId = c.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
```

但 `c.env.GOOGLE_CLIENT_ID` 返回 `undefined`。

## ✅ 解决方案

### 方案 1: 在 Cloudflare Dashboard 手动添加环境变量（推荐）

1. **访问 Cloudflare Dashboard**
   - 登录 https://dash.cloudflare.com
   - Workers & Pages → xiaoji-game-api

2. **进入设置 → 环境变量**
   - Settings → Variables and Secrets

3. **添加环境变量**

   **Plain Text Variables（公开变量）**:
   - `GOOGLE_CLIENT_ID` = `874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com`
   - `GOOGLE_REDIRECT_URI` = `https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback`

   **Encrypted Secrets（加密密钥已配置）**:
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `JWT_SECRET`
   - ✅ `SUPABASE_ANON_KEY`

4. **重新部署**
   ```bash
   wrangler deploy
   ```

---

### 方案 2: 修改 wrangler.toml 并重新部署

**当前问题**: `wrangler.toml` 中的 `[vars]` 配置没有生效。

**修改 `api/wrangler.toml`**:

确保这些行在最顶层的 `[vars]` 部分：

```toml
[vars]
API_VERSION = "v1"
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://df0c0a79.gggxiaoji.pages.dev"
SUPABASE_URL = "https://rfckzemofzlbixicfnib.supabase.co"
GOOGLE_CLIENT_ID = "874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback"
```

然后重新部署：
```bash
cd api
wrangler deploy
```

---

### 方案 3: 添加前端新地址到 CORS（已确认需要）

你的新前端地址是 `https://df0c0a79.gggxiaoji.pages.dev/`

**更新 wrangler.toml 第 15 行**:
```toml
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://df0c0a79.gggxiaoji.pages.dev"
```

**也要更新第 33 行**:
```toml
[env.production.vars]
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://df0c0a79.gggxiaoji.pages.dev"
```

---

## 🚀 快速修复步骤

### 步骤 1: 更新 CORS 配置

```bash
cd H:\cs\xiaoji-game\api
```

编辑 `wrangler.toml`，在第 15 行添加新地址：
```toml
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://df0c0a79.gggxiaoji.pages.dev"
```

### 步骤 2: 重新部署

```bash
wrangler deploy
```

### 步骤 3: 验证配置

```bash
curl https://xiaoji-game-api.weixinyongjiu.workers.dev/health
```

应该返回：
```json
{"status":"ok","timestamp":...,"version":"1.0.0"}
```

### 步骤 4: 测试 OAuth

在浏览器访问：
```
https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google
```

应该自动重定向到 Google 登录页面。

---

## 🔍 调试方法

### 查看 Workers 日志

```bash
wrangler tail --format pretty
```

然后在另一个终端触发请求：
```bash
curl https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google
```

### 检查环境变量

```bash
wrangler secret list
```

应该显示：
- GOOGLE_CLIENT_SECRET
- JWT_SECRET
- SUPABASE_ANON_KEY

---

## 🐛 常见问题

### Q: 为什么 wrangler.toml 中的变量没有生效？

A: Cloudflare Workers 有时需要在 Dashboard 中手动配置环境变量。`wrangler.toml` 中的 `[vars]` 有时不会被正确读取。

### Q: 如何确认变量已生效？

A: 部署后查看日志：
```bash
wrangler deploy
```

输出应该显示：
```
env.GOOGLE_CLIENT_ID ("874826851840-...")
env.GOOGLE_REDIRECT_URI ("https://xiaoji-game-api...")
```

### Q: 重新部署后还是 500 错误怎么办？

A: 
1. 清除浏览器缓存
2. 等待 30-60 秒让 Cloudflare 全球网络同步
3. 使用隐身模式测试
4. 检查 Cloudflare Dashboard 中的环境变量是否正确

---

## 📝 检查清单

- [ ] wrangler.toml 中 CORS_ORIGIN 包含新前端地址
- [ ] wrangler.toml 中 GOOGLE_CLIENT_ID 配置正确
- [ ] wrangler.toml 中 GOOGLE_REDIRECT_URI 配置正确
- [ ] Cloudflare Workers Secrets 包含 GOOGLE_CLIENT_SECRET
- [ ] 已运行 `wrangler deploy` 重新部署
- [ ] 等待 30 秒让配置生效
- [ ] 测试 OAuth 端点可以重定向到 Google

---

## 🔐 Google Cloud Console 配置

确保在 Google Cloud Console 中添加了回调 URL：

访问：https://console.cloud.google.com/apis/credentials

添加授权的重定向 URI：
```
https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback
https://df0c0a79.gggxiaoji.pages.dev
https://0dca8f01.gggxiaoji.pages.dev
https://gggxiaoji.pages.dev
```

---

**最后更新**: 2025-10-17  
**问题状态**: 待修复

请按照上述步骤操作后测试！
