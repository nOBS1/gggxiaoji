# Cloudflare 完整部署指南

**项目**: 🐔 鸡蛋模拟器  
**架构**: 前后端分离  
**部署目标**: Cloudflare Pages (前端) + Cloudflare Workers (后端)

---

## 📋 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Pages (前端)                      │
│          https://your-game.pages.dev                     │
│          - 静态HTML/CSS/JS                                │
│          - Vite 构建产物                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ API 请求
                   ▼
┌─────────────────────────────────────────────────────────┐
│           Cloudflare Workers (后端API)                    │
│          https://api.your-game.workers.dev               │
│          - Hono API 服务器                                │
│          - JWT 认证                                       │
│          - 游戏逻辑                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│               Supabase (数据库)                           │
│          - PostgreSQL 数据库                              │
│          - 用户数据、订单、交易记录                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 部署方案

### 方案 A: 推荐方案（完全使用 Cloudflare）

**优点**:
- ✅ 全球 CDN 加速
- ✅ 免费额度充足
- ✅ 自动 HTTPS
- ✅ 部署简单快速
- ✅ 零配置 CORS

**步骤**:
1. 前端部署到 **Cloudflare Pages**
2. 后端部署到 **Cloudflare Workers**
3. 配置 API URL

---

## 📦 第一步：部署后端 API 到 Cloudflare Workers

### 1.1 准备工作

```bash
cd H:\cs\xiaoji-game\api
```

### 1.2 登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器，登录你的 Cloudflare 账号。

### 1.3 配置环境变量

在 Cloudflare Dashboard 中设置密钥（推荐）或修改 `wrangler.toml`:

```bash
# 通过命令行设置密钥（推荐）
npx wrangler secret put SUPABASE_URL
# 输入你的 Supabase URL

npx wrangler secret put SUPABASE_ANON_KEY
# 输入你的 Supabase Anon Key

npx wrangler secret put JWT_SECRET
# 输入一个强密钥，例如: your-super-secret-jwt-key-change-this
```

### 1.4 修改 `wrangler.toml`

```toml
name = "xiaoji-game-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# 移除或注释掉 D1 和 KV 配置（因为我们用 Supabase）
# [[d1_databases]]
# [[kv_namespaces]]

# 环境变量（不要把密钥写在这里！）
[vars]
API_VERSION = "v1"
CORS_ORIGIN = "*"  # 部署后改为你的前端域名

# 兼容性标志
[compatibility_flags]
nodejs_compat = true
```

### 1.5 部署到 Cloudflare Workers

```bash
npm run deploy
```

或

```bash
npx wrangler deploy
```

**预期输出**:
```
✨ Successfully published your script to
   https://xiaoji-game-api.your-account.workers.dev
```

**记下这个 API URL，后面前端配置要用！**

### 1.6 测试 API

```bash
curl https://xiaoji-game-api.your-account.workers.dev/health
```

应该返回:
```json
{"status":"ok","timestamp":1234567890}
```

---

## 🎨 第二步：部署前端到 Cloudflare Pages

### 2.1 修改前端 API 配置

编辑 `src/js/config.js`:

```javascript
export const CONFIG = {
  // 修改为你的 Cloudflare Workers API URL
  API_BASE_URL: 'https://xiaoji-game-api.your-account.workers.dev/api',
  
  // ... 其他配置保持不变
};
```

### 2.2 构建前端

```bash
cd H:\cs\xiaoji-game
npm run build
```

这会生成 `dist/` 目录。

### 2.3 部署到 Cloudflare Pages

#### 方法 1: 通过 Git（推荐）

1. **创建 Git 仓库**（如果还没有）:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub/GitLab**:
   ```bash
   git remote add origin https://github.com/your-username/xiaoji-game.git
   git branch -M main
   git push -u origin main
   ```

3. **在 Cloudflare Dashboard 中**:
   - 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 点击 "Pages"
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 选择你的仓库
   - 配置构建设置：
     ```
     Build command: npm run build
     Build output directory: dist
     Root directory: /
     ```
   - 点击 "Save and Deploy"

#### 方法 2: 直接上传（快速测试）

```bash
# 安装 Wrangler（如果还没装）
npm install -g wrangler

# 直接部署 dist 目录
npx wrangler pages deploy dist --project-name xiaoji-game
```

**预期输出**:
```
✨ Successfully deployed to
   https://xiaoji-game.pages.dev
```

### 2.4 配置自定义域名（可选）

在 Cloudflare Pages 设置中，可以添加自定义域名，例如:
- `game.yourdomain.com`

---

## 🔧 第三步：配置 CORS 和环境变量

### 3.1 更新 Workers CORS 配置

在 Cloudflare Workers Dashboard 中设置环境变量:

```bash
npx wrangler secret put CORS_ORIGIN
# 输入: https://xiaoji-game.pages.dev
```

或者在部署前修改 `wrangler.toml`:

```toml
[vars]
CORS_ORIGIN = "https://xiaoji-game.pages.dev"
```

然后重新部署:
```bash
cd api
npm run deploy
```

### 3.2 更新前端 API URL（如果还没改）

在 `src/js/config.js` 中确认 API URL 正确:

```javascript
export const CONFIG = {
  API_BASE_URL: 'https://xiaoji-game-api.your-account.workers.dev/api',
  // ...
};
```

然后重新构建并部署前端。

---

## 📝 完整部署脚本

创建一个一键部署脚本 `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 开始部署鸡蛋模拟器..."

# 1. 部署后端 API
echo "📦 部署后端 API..."
cd api
npm run deploy
cd ..

# 2. 构建前端
echo "🎨 构建前端..."
npm run build

# 3. 部署前端
echo "📤 部署前端..."
npx wrangler pages deploy dist --project-name xiaoji-game

echo "✅ 部署完成！"
echo "前端: https://xiaoji-game.pages.dev"
echo "后端: https://xiaoji-game-api.your-account.workers.dev"
```

Windows PowerShell 版本 `deploy.ps1`:

```powershell
Write-Host "🚀 开始部署鸡蛋模拟器..." -ForegroundColor Green

# 1. 部署后端 API
Write-Host "📦 部署后端 API..." -ForegroundColor Yellow
cd api
npm run deploy
cd ..

# 2. 构建前端
Write-Host "🎨 构建前端..." -ForegroundColor Yellow
npm run build

# 3. 部署前端
Write-Host "📤 部署前端..." -ForegroundColor Yellow
npx wrangler pages deploy dist --project-name xiaoji-game

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "前端: https://xiaoji-game.pages.dev"
Write-Host "后端: https://xiaoji-game-api.your-account.workers.dev"
```

使用方法:
```bash
# Windows
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

---

## 🧪 测试部署

### 测试清单

1. **前端访问**
   - [ ] 打开 `https://xiaoji-game.pages.dev`
   - [ ] 页面正常加载
   - [ ] 图片正常显示

2. **API 连接**
   - [ ] 能够注册新用户
   - [ ] 能够登录
   - [ ] 游戏数据正常保存

3. **市场功能**
   - [ ] 能够创建订单
   - [ ] 能够查看订单列表
   - [ ] 能够购买/取消订单

4. **跨域问题**
   - [ ] 没有 CORS 错误
   - [ ] API 请求正常返回

---

## 🐛 常见问题排查

### 问题 1: CORS 错误

**症状**:
```
Access to fetch at 'https://xxx.workers.dev' from origin 'https://xxx.pages.dev' 
has been blocked by CORS policy
```

**解决**:
1. 确认 Workers 的 `CORS_ORIGIN` 环境变量设置正确
2. 检查 `src/index.ts` 中的 CORS 中间件配置

### 问题 2: API 请求失败

**症状**:
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

**解决**:
1. 检查 `config.js` 中的 `API_BASE_URL` 是否正确
2. 确认 Workers 已成功部署
3. 测试 API URL: `curl https://your-api.workers.dev/health`

### 问题 3: 环境变量未生效

**症状**:
```
Error: SUPABASE_URL is not defined
```

**解决**:
```bash
# 重新设置环境变量
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put JWT_SECRET

# 重新部署
npm run deploy
```

### 问题 4: 构建失败

**症状**:
```
Error: Cannot find module 'xxx'
```

**解决**:
```bash
# 清理并重新安装依赖
cd api
rm -rf node_modules
npm install

cd ..
rm -rf node_modules
npm install
```

---

## 💰 成本估算

### Cloudflare 免费额度

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| Pages | 无限带宽 | 每月 500 次构建 |
| Workers | 100,000 请求/天 | 每个请求最多 10ms CPU 时间 |
| Workers KV | 100,000 读/天 | 如果需要缓存 |

**估算**:
- 假设每个用户每天 100 次 API 请求
- 免费额度可支持 **1000 个活跃用户/天**
- 对于个人项目或小型游戏，完全免费！

---

## 🔐 安全建议

### 1. 密钥管理

✅ **推荐做法**:
```bash
# 使用 Wrangler Secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put SUPABASE_ANON_KEY
```

❌ **不要这样**:
```toml
# wrangler.toml
[vars]
JWT_SECRET = "my-secret-key"  # ❌ 不要把密钥写在配置文件里！
```

### 2. CORS 配置

**开发环境**:
```javascript
CORS_ORIGIN = "*"  // 允许所有来源（仅用于开发）
```

**生产环境**:
```javascript
CORS_ORIGIN = "https://xiaoji-game.pages.dev"  // 只允许你的前端域名
```

### 3. 环境隔离

```bash
# 开发环境
npx wrangler dev

# 生产环境
npx wrangler deploy --env production
```

---

## 📊 监控和日志

### 查看 Workers 日志

```bash
npx wrangler tail
```

### 在 Cloudflare Dashboard 中

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 查看 "Metrics" 和 "Logs"

---

## 🎯 下一步优化

### 短期（上线后立即做）
1. ✅ 设置自定义域名
2. ✅ 配置 Google Analytics（可选）
3. ✅ 添加错误监控（Sentry）

### 中期（1-2 周）
1. 添加 CDN 缓存策略
2. 优化图片加载（WebP 格式）
3. 添加 Service Worker（PWA）

### 长期（1 个月+）
1. 实现 WebSocket（实时更新）
2. 添加 Redis 缓存（Workers KV）
3. 性能优化（代码分割、懒加载）

---

## 📞 获取帮助

如果遇到问题:
1. 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
2. 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
3. 检查项目中的其他文档
4. 查看 API 和前端的控制台日志

---

## ✅ 部署检查清单

上线前确认:

### 后端 API
- [ ] Cloudflare Workers 已部署
- [ ] 环境变量已正确设置（Supabase URL, Keys, JWT Secret）
- [ ] API 健康检查通过 (`/health`)
- [ ] CORS 配置正确

### 前端
- [ ] `config.js` 中 API_BASE_URL 已更新为 Workers URL
- [ ] 前端已构建 (`npm run build`)
- [ ] Cloudflare Pages 已部署
- [ ] 页面可以正常访问

### 功能测试
- [ ] 用户注册/登录正常
- [ ] 游戏数据保存正常
- [ ] 市场交易功能正常
- [ ] 没有 CORS 错误
- [ ] 图片加载正常

### 可选优化
- [ ] 自定义域名配置
- [ ] Google Analytics 配置
- [ ] 错误监控配置

---

**最后更新**: 2025-10-11  
**部署方式**: Cloudflare Pages + Workers  
**数据库**: Supabase PostgreSQL
