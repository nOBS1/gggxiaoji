# 🚀 Google OAuth 快速启动指南

**版本**: v3.0.0  
**配置状态**: ✅ 已完成  
**最后检查**: 2025-10-14

---

## ✅ 配置完成情况

- ✅ Google OAuth 凭据已获取并配置
- ✅ 后端配置文件已更新 (wrangler.toml, .dev.vars)
- ✅ 前端配置文件已更新 (config.js)
- ✅ OAuth 路由代码已实现
- ⚠️ **仅需一步**: 在 Google Console 添加回调 URI

---

## 🔴 最后一步：添加回调 URI (必须完成)

### 1. 打开 Google Cloud Console

访问: https://console.cloud.google.com/apis/credentials

### 2. 找到你的 OAuth 客户端

- 项目: `proven-chain-424809-s7`
- 客户端 ID: `874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s`
- 点击编辑 ✏️

### 3. 添加授权重定向 URI

在 **"已获授权的重定向 URI"** 部分，添加：

```
http://localhost:8787/api/auth/google/callback
```

### 4. 保存

点击页面底部的 **"保存"** 按钮。

---

## 🎮 启动和测试

### 步骤 1: 启动后端 (当前窗口)

```powershell
# 确保在 api 目录
cd H:\cs\xiaoji-game\api

# 启动开发服务器
npm run dev
```

**预期输出**:
```
> xiaoji-game-api@3.0.0 dev
> tsx watch server.ts

🚀 Server is running on http://localhost:8787
```

### 步骤 2: 启动前端 (新窗口)

**打开新的 PowerShell 窗口**，运行：

```powershell
# 回到项目根目录
cd H:\cs\xiaoji-game

# 启动前端开发服务器
npm run dev
```

**预期输出**:
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 步骤 3: 测试 Google 登录

1. 打开浏览器访问: **http://localhost:5173**

2. 点击右上角的 **"登录"** 按钮

3. 在弹出的登录窗口中，找到 Google 图标按钮并点击

4. 浏览器会跳转到 Google 授权页面

5. 选择你的 Google 账号并授权

6. 自动跳回游戏页面

7. **成功！** 你应该看到：
   - ✅ 右上角显示你的 Google 头像
   - ✅ Toast 提示 "Google 登录成功！"
   - ✅ 控制台显示 "✅ Google OAuth 登录成功"

---

## 🔍 验证登录状态

### 浏览器控制台 (F12)

打开浏览器开发者工具 (按 F12)，在 Console 标签应该看到：

```
🔐 初始化认证UI...
🔗 启动 Google OAuth 登录...
OAuth URL: http://localhost:8787/api/auth/google
✅ Google OAuth 登录成功
✅ 认证UI初始化完成
```

### 后端日志

后端服务器终端应该显示：

```
Redirecting to Google OAuth: https://accounts.google.com/o/oauth2/v2/auth?...
Received authorization code, exchanging for token...
Successfully obtained access token
Google user info: { id: '...', email: '...', name: '...' }
Creating new user from Google OAuth (或 Existing user found)
JWT token generated for user: xxx
Redirecting to frontend: http://localhost:5173/?token=...&oauth_success=true
```

### localStorage 检查

在浏览器控制台运行：

```javascript
localStorage.getItem('auth_token')
localStorage.getItem('user_info')
```

应该看到有效的 JWT token 和用户信息。

---

## 🐛 常见问题排查

### 问题 1: redirect_uri_mismatch

**症状**: 点击 Google 登录后显示错误：
```
Error: redirect_uri_mismatch
```

**原因**: Google Console 中没有添加回调 URI。

**解决**: 按照上面"最后一步"添加 `http://localhost:8787/api/auth/google/callback`

---

### 问题 2: 后端无法启动 (端口占用)

**症状**:
```
Error: listen EADDRINUSE: address already in use :::8787
```

**解决**:

```powershell
# 查找占用进程
netstat -ano | findstr :8787

# 终止进程 (替换 PID 为实际值)
taskkill /PID <PID> /F

# 重新启动
npm run dev
```

---

### 问题 3: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误。

**检查**:
- 前端是否运行在 `http://localhost:5173`
- 后端 CORS 配置是否包含该地址

**查看**: `api/src/index.ts` 第 49-63 行

---

### 问题 4: 登录后页面无反应

**检查步骤**:

1. 打开浏览器开发者工具 (F12)
2. 查看 **Console** 标签的错误信息
3. 查看 **Network** 标签，检查 `/api/auth/google` 和回调请求
4. 查看后端服务器日志

**常见原因**:
- Token 解析失败
- localStorage 存储问题
- UI 更新函数未正确触发

---

## 📊 配置摘要

### Google OAuth 凭据

```
Client ID:     874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com
Client Secret: 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
Project ID:    proven-chain-424809-s7
```

### 回调 URI

**本地开发**:
```
http://localhost:8787/api/auth/google/callback
```

**生产环境** (需要添加):
```
https://chickgamehub.online/api/auth/google/callback
```

### 服务器地址

- **后端 API**: http://localhost:8787
- **前端界面**: http://localhost:5173

---

## 🎯 测试清单

完成以下测试以确保功能正常：

- [ ] 后端服务器成功启动在端口 8787
- [ ] 前端服务器成功启动在端口 5173
- [ ] 浏览器可以访问 http://localhost:5173
- [ ] 点击登录按钮弹出登录窗口
- [ ] 点击 Google 图标跳转到 Google 授权页面
- [ ] 选择 Google 账号并授权
- [ ] 自动跳回游戏页面
- [ ] 右上角显示 Google 头像和昵称
- [ ] Toast 提示登录成功
- [ ] localStorage 中存储了 auth_token 和 user_info
- [ ] 刷新页面后仍保持登录状态
- [ ] 本地游戏数据自动同步到服务器

---

## 🚢 生产环境部署

### 准备工作

1. **在 Google Console 添加生产回调 URI**:
   ```
   https://chickgamehub.online/api/auth/google/callback
   ```

2. **更新前端配置** (`src/js/config.js`):
   ```javascript
   API_BASE_URL: 'https://your-api.workers.dev/api',
   ```

3. **更新后端配置** (`api/wrangler.toml`):
   ```toml
   [env.production.vars]
   GOOGLE_REDIRECT_URI = "https://chickgamehub.online/api/auth/google/callback"
   ```

### 部署命令

```bash
# 部署后端
cd api
wrangler login
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET
wrangler deploy

# 部署前端
cd ..
npm run build
npx wrangler pages deploy dist --project-name xiaoji-game
```

---

## 📞 需要帮助？

如果遇到任何问题：

1. 检查 `GOOGLE_OAUTH_CONFIG_STEPS.md` 详细配置说明
2. 查看 `CLOUDFLARE_GOOGLE_OAUTH_GUIDE.md` 完整部署指南
3. 运行 `node api/check-oauth-config.js` 验证配置
4. 查看浏览器控制台和后端日志的错误信息

---

**祝你测试顺利！** 🎉

如有问题随时联系我！
