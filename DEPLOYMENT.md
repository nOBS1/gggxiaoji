# 🚀 部署指南

本文档提供详细的部署说明，帮助你将游戏部署到生产环境。

## 📋 目录

- [构建准备](#构建准备)
- [本地构建](#本地构建)
- [部署到 Vercel](#部署到-vercel)
- [部署到 Netlify](#部署到-netlify)
- [部署到 GitHub Pages](#部署到-github-pages)
- [部署到 Cloudflare Pages](#部署到-cloudflare-pages)
- [自定义域名](#自定义域名)

## 构建准备

### 1. 环境检查

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0

# 检查 npm 版本
npm --version   # 应该 >= 9.0.0
```

### 2. 安装依赖

```bash
cd xiaoji-game
npm install
```

### 3. 本地测试

```bash
# 开发模式测试
npm run dev

# 访问 http://localhost:3000 测试所有功能
```

## 本地构建

```bash
# 生产构建
npm run build

# 构建产物在 dist/ 目录
# 可以预览构建结果
npm run preview
```

构建后的文件结构：
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

## 部署到 Vercel

### 方法1: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 方法2: 通过 GitHub 集成

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. 配置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. 点击 "Deploy"

### Vercel 配置文件 (可选)

创建 `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## 部署到 Netlify

### 方法1: 拖拽部署

1. 运行 `npm run build`
2. 访问 [netlify.com](https://netlify.com)
3. 拖拽 `dist` 文件夹到部署区域

### 方法2: 通过 Git 集成

1. 将代码推送到 GitHub/GitLab
2. 在 Netlify 创建新站点
3. 选择仓库
4. 配置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. 点击 "Deploy site"

### Netlify 配置文件

创建 `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 部署到 GitHub Pages

### 1. 修改 vite.config.js

```javascript
export default defineConfig({
  base: '/xiaoji-game/',  // 改为你的仓库名
  // ...其他配置
});
```

### 2. 使用 gh-pages 包

```bash
# 安装 gh-pages
npm install -D gh-pages

# 添加部署脚本到 package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# 部署
npm run deploy
```

### 3. GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install and Build
        run: |
          npm ci
          npm run build
          
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 部署到 Cloudflare Pages

### 通过 Dashboard

1. 登录 [Cloudflare Pages](https://pages.cloudflare.com)
2. 连接 GitHub 仓库
3. 配置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**: `NODE_VERSION=18`
4. 保存并部署

### 通过 Wrangler CLI

```bash
# 安装 Wrangler
npm i -g wrangler

# 登录
wrangler login

# 部署
wrangler pages publish dist --project-name=xiaoji-game
```

## 自定义域名

### Vercel

1. 在项目设置中点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS

### Netlify

1. 在站点设置中点击 "Domain management"
2. 添加自定义域名
3. 配置 DNS：
   ```
   A记录: 75.2.60.5
   或 CNAME: [your-site].netlify.app
   ```

### GitHub Pages

1. 在仓库设置中找到 "Pages"
2. 添加自定义域名
3. 配置 DNS：
   ```
   A记录:
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   
   或 CNAME: [username].github.io
   ```

### Cloudflare Pages

1. 在项目设置中点击 "Custom domains"
2. 添加域名（如果域名在 Cloudflare，会自动配置）

## 📊 性能优化建议

### 1. 启用压缩

大多数平台默认启用 Gzip/Brotli 压缩。

### 2. 配置缓存

在 `public/_headers` (Netlify) 或通过平台设置配置：
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

### 3. CDN 加速

所有推荐的平台都内置全球 CDN。

## 🔒 安全配置

### 添加安全头

创建 `public/_headers` (Netlify):
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

## 🐛 故障排查

### 构建失败

- 检查 Node.js 版本
- 清理缓存：`rm -rf node_modules package-lock.json && npm install`
- 检查控制台错误日志

### 页面空白

- 检查 `base` 配置是否正确
- 打开浏览器开发者工具查看错误
- 检查资源路径是否正确

### 刷新404

- 确保配置了 SPA 重定向规则
- 检查平台的路由配置

## 📞 获取帮助

如遇到问题，请：
1. 查看平台官方文档
2. 检查构建日志
3. 在 GitHub Issues 提问

---

**祝部署顺利！🎉**
