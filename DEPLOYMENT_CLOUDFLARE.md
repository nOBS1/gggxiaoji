# 🚀 Cloudflare 部署指南

完整的前后端部署到 Cloudflare 平台。

---

## 📊 架构概览

```
前端（静态网站）
  ↓ Cloudflare Pages
  ↓ https://xiaoji-game.pages.dev
  
后端 API
  ↓ Cloudflare Workers
  ↓ https://xiaoji-game-api.your-subdomain.workers.dev
  
数据库
  ↓ Supabase PostgreSQL
  ↓ https://rfckzemofzlbixicfnib.supabase.co
```

---

## 🔧 前置准备

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 2. 确保数据库已配置

- ✅ Supabase 数据库已初始化
- ✅ RLS 已禁用（开发环境）或配置好策略（生产环境）

---

## 🎨 部署前端到 Cloudflare Pages

### 方法 1: 通过 Dashboard（推荐）

1. **访问** https://dash.cloudflare.com
2. **进入** Pages 部分
3. **点击** "Create a project"
4. **连接** GitHub 仓库（或直接上传）
5. **配置构建**：
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```
6. **点击** "Save and Deploy"

### 方法 2: 使用命令行

```bash
# 在项目根目录
cd H:\cs\xiaoji-game

# 构建前端
npm run build

# 部署到 Pages
npx wrangler pages deploy dist --project-name=xiaoji-game
```

**部署成功后，您会获得一个 URL：**
```
https://xiaoji-game.pages.dev
```

---

## 🔌 部署后端 API 到 Cloudflare Workers

### 步骤 1: 准备代码

后端代码已经兼容 Workers！但需要做小调整。

**更新 package.json 添加构建脚本：**

```json
{
  "scripts": {
    "dev": "tsx watch server.ts",
    "build": "tsc",
    "deploy": "wrangler deploy"
  }
}
```

### 步骤 2: 替换 wrangler.toml

将 `api/wrangler.toml.new` 重命名为 `wrangler.toml`：

```bash
cd api
mv wrangler.toml wrangler.toml.old
mv wrangler.toml.new wrangler.toml
```

### 步骤 3: 设置 Secrets

```bash
cd api

# 设置 Supabase API Key
wrangler secret put SUPABASE_ANON_KEY
# 输入: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 设置 JWT Secret
wrangler secret put JWT_SECRET
# 输入: 一个强随机字符串
```

### 步骤 4: 部署

```bash
cd api

# 安装依赖
npm install

# 部署到 Workers
npm run deploy

# 或直接使用 wrangler
wrangler deploy
```

**部署成功后，您会获得一个 API URL：**
```
https://xiaoji-game-api.your-subdomain.workers.dev
```

---

## 🔗 配置前端连接后端

### 更新前端 API 地址

在前端项目中，更新 API 基础 URL：

```javascript
// src/js/api.js 或配置文件
const API_BASE_URL = 'https://xiaoji-game-api.your-subdomain.workers.dev';
```

### 重新部署前端

```bash
cd H:\cs\xiaoji-game
npm run build
npx wrangler pages deploy dist --project-name=xiaoji-game
```

---

## 📊 成本分析

### Cloudflare Pages（前端）

**免费额度：**
- ✅ 无限制带宽
- ✅ 500 次构建/月
- ✅ 无限请求

**基本够用！** 除非月访问量超过百万级别。

### Cloudflare Workers（后端）

**免费额度：**
- ✅ 100,000 请求/天
- ✅ 10ms CPU 时间/请求
- ✅ 128MB 内存

**付费计划（$5/月）：**
- ✅ 10,000,000 请求/月
- ✅ 50ms CPU 时间/请求
- ✅ 无限内存

**评估：**
- 小型游戏（<1000 DAU）：免费额度够用
- 中型游戏（1000-5000 DAU）：需要付费
- 大型游戏（>5000 DAU）：考虑其他方案

### Supabase（数据库）

**免费额度：**
- ✅ 500MB 数据库空间
- ✅ 无限 API 请求
- ✅ 50,000 月活用户

**付费计划（$25/月）：**
- ✅ 8GB 数据库空间
- ✅ 无限 API 请求
- ✅ 100,000 月活用户

---

## ⚠️ Workers 限制和注意事项

### 需要调整的地方：

1. **移除 Node.js 特定代码**
   - ❌ `fs`, `path` 模块
   - ✅ 使用 Web APIs

2. **环境变量访问**
   - 从 `process.env` 改为 `env` 参数

3. **依赖限制**
   - 某些 npm 包可能不兼容
   - `@supabase/supabase-js` ✅ 兼容
   - `hono` ✅ 兼容

---

## 🔄 方案 B：Vercel（备选）

如果 Workers 有问题，可以用 Vercel：

```bash
# 部署后端到 Vercel
cd api
vercel

# 部署前端到 Cloudflare Pages（保持不变）
```

**优点：**
- ✅ 完全兼容 Node.js
- ✅ 更大的执行时间限制
- ✅ 免费额度充足

**缺点：**
- ⚠️ 全球分布不如 Cloudflare
- ⚠️ 冷启动时间较长

---

## 🔄 方案 C：Railway（备选）

适合需要长时间运行的场景：

```bash
# 使用 Railway CLI 或 Dashboard
railway up
```

**优点：**
- ✅ 完全兼容 Node.js
- ✅ 无执行时间限制
- ✅ 免费 $5 额度/月

**缺点：**
- 💰 免费额度用完后需付费
- ⚠️ 单区域部署（可选多区域但更贵）

---

## 📝 推荐方案

### 小型项目（< 1000 DAU）
```
前端: Cloudflare Pages (免费)
后端: Cloudflare Workers (免费)
数据库: Supabase (免费)

总成本: $0/月 ✅
```

### 中型项目（1000-5000 DAU）
```
前端: Cloudflare Pages (免费)
后端: Cloudflare Workers ($5/月)
数据库: Supabase (免费)

总成本: $5/月
```

### 大型项目（> 5000 DAU）
```
前端: Cloudflare Pages (免费)
后端: Vercel Pro ($20/月) 或 Railway ($20-50/月)
数据库: Supabase Pro ($25/月)

总成本: $45-75/月
```

---

## 🚀 下一步

1. ✅ 选择部署方案
2. ✅ 部署后端 API
3. ✅ 部署前端网站
4. ✅ 配置自定义域名（可选）
5. ✅ 设置监控和告警

---

## 📚 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Supabase 文档](https://supabase.com/docs)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

**问题？** 查看 [SUPABASE_SETUP.md](./api/SUPABASE_SETUP.md) 或 [QUICKSTART.md](./api/QUICKSTART.md)
