# Google OAuth 错误修复总结

**问题**: GET http://localhost:8787/api/auth/google 返回 500 错误

**修复时间**: 2025-10-14

---

## 🐛 问题分析

### 错误信息
```
GET http://localhost:8787/api/auth/google 500 (Internal Server Error)
```

### 根本原因

1. **环境变量未正确传递**: 本地开发服务器中 `c.env` 对象为空或未包含 Google OAuth 配置
2. **端口不一致**: `server.ts` 使用端口 3001，但配置期望 8787
3. **环境变量分散**: OAuth 配置在 `.dev.vars` 但服务器读取 `.env`

---

## ✅ 已应用的修复

### 1. 修复服务器端口

**文件**: `api/server.ts`

```typescript
// 修改前
const port = parseInt(process.env.PORT || '3001');

// 修改后
const port = parseInt(process.env.PORT || '8787');
```

### 2. 增强环境变量注入

**文件**: `api/src/index.ts`

```typescript
// 修改后 - 确保所有环境变量正确注入
app.use('*', async (c, next) => {
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
```

### 3. 统一环境变量配置

**文件**: `api/.env`

添加了 Google OAuth 配置：

```env
# Google OAuth 配置
GOOGLE_CLIENT_ID=874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
```

### 4. 创建调试工具

创建了两个调试脚本：

- **`debug-env.js`**: 检查环境变量是否正确加载
- **`restart.ps1`**: 快速重启后端服务器

---

## 🔧 重启服务器步骤

### 方法 1: 使用重启脚本 (推荐)

```powershell
cd H:\cs\xiaoji-game\api
.\restart.ps1
```

### 方法 2: 手动重启

```powershell
# 1. 查找并终止占用端口的进程
netstat -ano | findstr :8787
taskkill /PID <PID> /F

# 2. 重新启动
npm run dev
```

---

## ✅ 验证修复

### 1. 检查环境变量

```powershell
cd H:\cs\xiaoji-game\api
node debug-env.js
```

**预期输出**:
```
✅ SUPABASE_URL              = https://rfckzemofzlb...
✅ SUPABASE_ANON_KEY         = eyJhbGciOiJIUzI1NiIs...
✅ JWT_SECRET                = your-super-secret-jw...
✅ GOOGLE_CLIENT_ID          = 874826851840-k34jj87...
✅ GOOGLE_CLIENT_SECRET      = GOCSPX-K9Mjg4xaQp_Yw...
✅ GOOGLE_REDIRECT_URI       = http://localhost:878...
✅ PORT                      = 8787

✅ 所有环境变量已正确加载！
```

### 2. 启动后端服务器

```powershell
cd H:\cs\xiaoji-game\api
npm run dev
```

**预期输出**:
```
🚀 启动服务器在端口 8787...
📍 API 地址: http://localhost:8787
🗄️  Supabase: https://rfckzemofzlbixicfnib.supabase.co
```

### 3. 测试 OAuth 端点

在浏览器访问:
```
http://localhost:8787/api/auth/google
```

**预期行为**: 
- ✅ 重定向到 Google 授权页面
- ❌ 不再显示 500 错误

**后端日志应显示**:
```
Redirecting to Google OAuth: https://accounts.google.com/o/oauth2/v2/auth?...
```

---

## 🧪 完整测试流程

### 步骤 1: 重启后端

```powershell
cd H:\cs\xiaoji-game\api
.\restart.ps1
```

### 步骤 2: 启动前端 (新窗口)

```powershell
cd H:\cs\xiaoji-game
npm run dev
```

### 步骤 3: 浏览器测试

1. 访问: http://localhost:5173
2. 点击 **"登录"** 按钮
3. 点击 **Google** 图标
4. 应该跳转到 Google 授权页面 ✅

### 步骤 4: 检查日志

**后端日志** (应该看到):
```
Redirecting to Google OAuth: https://accounts.google.com/o/oauth2/v2/auth?client_id=874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s...
```

**浏览器控制台** (F12 → Console):
```
🔗 启动 Google OAuth 登录...
OAuth URL: http://localhost:8787/api/auth/google
```

---

## 🚨 如果仍然有问题

### 检查清单

- [ ] 确认 `.env` 文件中包含所有 Google OAuth 配置
- [ ] 确认后端服务器运行在端口 8787
- [ ] 确认前端服务器运行在端口 5173
- [ ] 确认 Google Console 中已添加回调 URI: `http://localhost:8787/api/auth/google/callback`
- [ ] 清除浏览器缓存并刷新页面
- [ ] 检查浏览器控制台的错误信息

### 查看详细日志

在 `api/src/routes/oauth.ts` 第 36 行，如果看到错误：
```
Missing Google OAuth configuration
```

说明环境变量仍未正确加载，请运行：
```powershell
node api/debug-env.js
```

---

## 📝 配置文件对照表

### .env (主要配置)
```env
SUPABASE_URL=https://rfckzemofzlbixicfnib.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=8787
GOOGLE_CLIENT_ID=874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
```

### .dev.vars (Cloudflare Workers 本地开发)
```env
GOOGLE_CLIENT_SECRET=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
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**注意**: 两个文件都需要，因为：
- `.env` 用于 `npm run dev` (tsx 本地服务器)
- `.dev.vars` 用于 `wrangler dev` (Cloudflare Workers 模拟器)

---

## 🎯 下一步

修复完成后，参考 `QUICK_START.md` 继续测试完整的 Google OAuth 登录流程。

---

**修复状态**: ✅ 已完成  
**测试状态**: ⏳ 待测试  
**文档更新**: 2025-10-14
