# Google OAuth 配置完成步骤

**当前状态**: ✅ 已获取凭据，⚠️ 需要添加回调 URI

---

## 🔴 重要：必须配置回调 URI

你当前的 Google OAuth 配置中只有 JavaScript 来源，但**缺少授权重定向 URI**，这会导致 OAuth 登录失败！

### 立即配置步骤

1. **访问 Google Cloud Console**
   - 打开: https://console.cloud.google.com/
   - 选择项目: `proven-chain-424809-s7`

2. **进入凭据页面**
   - 左侧菜单: **APIs & Services** → **Credentials**
   - 找到你的 OAuth 2.0 客户端 ID: `874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s`
   - 点击编辑（铅笔图标）

3. **添加授权的重定向 URI**

   在 **"授权的重定向 URI"** 部分，点击 **"添加 URI"**，添加以下 URI：

   **本地开发环境**:
   ```
   http://localhost:8787/api/auth/google/callback
   ```

   **生产环境** (你的域名):
   ```
   https://chickgamehub.online/api/auth/google/callback
   ```

   或者如果你的 API 是独立部署的：
   ```
   https://api.chickgamehub.online/api/auth/google/callback
   ```

4. **点击保存**

---

## ✅ 当前配置摘要

### 已配置的凭据

**Client ID**:
```
874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com
```

**Client Secret**:
```
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
```

**项目 ID**:
```
proven-chain-424809-s7
```

### 当前授权的 JavaScript 来源

- ✅ `https://chickgamehub.online`

### 需要添加的重定向 URI

- ⚠️ `http://localhost:8787/api/auth/google/callback` (本地开发)
- ⚠️ `https://chickgamehub.online/api/auth/google/callback` (生产环境)

---

## 🚀 配置完成后的测试步骤

### 1. 启动后端服务器

```powershell
# 在 api 目录下
cd H:\cs\xiaoji-game\api
npm run dev
```

等待输出类似：
```
> xiaoji-game-api@3.0.0 dev
> tsx watch server.ts
🚀 Server is running on http://localhost:8787
```

### 2. 启动前端开发服务器

打开**新的 PowerShell 窗口**:

```powershell
# 在项目根目录
cd H:\cs\xiaoji-game
npm run dev
```

等待输出类似：
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. 测试 Google 登录

1. 打开浏览器访问: `http://localhost:5173`
2. 点击页面上的 **"登录"** 按钮
3. 在登录弹窗中，点击 **"Google"** 图标按钮
4. 应该会跳转到 Google 授权页面
5. 选择你的 Google 账号并授权
6. 自动跳回游戏页面，登录成功！

### 4. 检查登录状态

登录成功后，你应该看到：
- ✅ 右上角显示你的 Google 头像和昵称
- ✅ Toast 提示 "Google 登录成功！"
- ✅ 本地游戏数据自动同步到服务器

---

## 🐛 常见问题

### Q1: 点击 Google 登录后显示 "redirect_uri_mismatch" 错误

**原因**: Google Console 中没有添加回调 URI。

**解决**: 按照上面的步骤添加 `http://localhost:8787/api/auth/google/callback`

### Q2: 后端服务器无法启动

**可能原因**:
- 端口 8787 已被占用

**解决**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :8787

# 杀掉进程（将 PID 替换为实际进程 ID）
taskkill /PID <PID> /F

# 重新启动
npm run dev
```

### Q3: CORS 错误

**原因**: 前端端口与后端配置不匹配。

**检查**:
- 前端是否运行在 `http://localhost:5173`
- 后端 CORS 配置中是否包含该地址

**查看**: `api/src/index.ts` 第 51-56 行

### Q4: 登录后没反应

**检查浏览器控制台**:
- 按 F12 打开开发者工具
- 查看 Console 标签的错误信息
- 查看 Network 标签的网络请求

---

## 📝 生产环境部署配置

### 更新回调 URI

部署到生产环境后，需要在 Google Console 中添加生产环境的回调 URI。

根据你的部署方式：

#### 方案 1: 前后端同域名部署

如果前端和后端都部署在 `chickgamehub.online`:

```
https://chickgamehub.online/api/auth/google/callback
```

#### 方案 2: 前后端分离部署

如果后端部署在 Cloudflare Workers:

```
https://xiaoji-game-api-YOUR_NAME.workers.dev/api/auth/google/callback
```

如果后端使用自定义域名:

```
https://api.chickgamehub.online/api/auth/google/callback
```

### 更新 wrangler.toml 生产配置

编辑 `api/wrangler.toml`:

```toml
[env.production.vars]
CORS_ORIGIN = "https://chickgamehub.online"
GOOGLE_REDIRECT_URI = "https://chickgamehub.online/api/auth/google/callback"
```

### 设置 Cloudflare Secrets

```bash
cd api

# 登录 Cloudflare
wrangler login

# 设置密钥
wrangler secret put GOOGLE_CLIENT_SECRET
# 输入: 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

wrangler secret put SUPABASE_ANON_KEY
# 输入你的 Supabase Anon Key

wrangler secret put JWT_SECRET
# 输入一个强随机密钥（建议用 OpenSSL 生成）
```

生成强随机 JWT 密钥:

```powershell
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 部署

```bash
# 部署后端
wrangler deploy

# 部署前端
cd ..
npm run build
npx wrangler pages deploy dist --project-name xiaoji-game
```

---

## ✅ 配置检查清单

在开始测试前，确保以下项目已完成：

- [ ] Google Console 中已添加本地开发回调 URI: `http://localhost:8787/api/auth/google/callback`
- [ ] `api/wrangler.toml` 中 GOOGLE_CLIENT_ID 已更新
- [ ] `api/.dev.vars` 中 GOOGLE_CLIENT_SECRET 已更新
- [ ] 后端服务器已启动 (端口 8787)
- [ ] 前端开发服务器已启动 (端口 5173)
- [ ] 浏览器可以访问 `http://localhost:5173`

---

## 📞 需要帮助？

如果遇到任何问题，请检查：

1. **浏览器控制台** (F12 → Console)
2. **后端服务器日志** (运行 `npm run dev` 的终端窗口)
3. **Network 请求** (F12 → Network 标签)

将错误信息提供给我，我会帮你解决！

---

**最后更新**: 2025-10-14  
**状态**: ⚠️ 等待配置回调 URI
