# 小鸡游戏 Cloudflare 部署总结

## ✅ 已完成部署

### 1. API 部署到 Cloudflare Workers
- **Worker URL**: `https://xiaoji-game-api.weixinyongjiu.workers.dev`
- **API 基础路径**: `https://xiaoji-game-api.weixinyongjiu.workers.dev/api`
- **状态**: ✅ 已成功部署

### 2. 前端部署到 Cloudflare Pages
- **Pages URL**: `https://0dca8f01.gggxiaoji.pages.dev`
- **主域名**: `https://gggxiaoji.pages.dev`
- **状态**: ✅ 已部署并正在运行

### 3. 环境变量和密钥配置
已配置的 Cloudflare Workers 密钥：
- ✅ `JWT_SECRET` - JWT 令牌签名密钥
- ✅ `SUPABASE_ANON_KEY` - Supabase 匿名访问密钥
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth 客户端密钥

已配置的环境变量：
- ✅ `API_VERSION`: v1
- ✅ `CORS_ORIGIN`: Pages 域名白名单
- ✅ `SUPABASE_URL`: Supabase 数据库地址
- ✅ `GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID
- ✅ `GOOGLE_REDIRECT_URI`: OAuth 回调地址

### 4. 前端配置更新
- ✅ `src/js/config.js` 已更新为指向生产环境 API

---

## 🔧 需要手动完成的步骤

### Google OAuth 回调 URL 配置

为了让 Google OAuth 登录正常工作，你需要在 Google Cloud Console 中添加以下回调 URL：

#### 步骤：

1. **访问 Google Cloud Console**
   - 打开 [Google Cloud Console](https://console.cloud.google.com/)
   - 选择你的项目

2. **导航到 OAuth 凭据页面**
   - 左侧菜单：API 和服务 → 凭据
   - 找到你的 OAuth 2.0 客户端 ID（客户端 ID：`874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com`）
   - 点击进入编辑

3. **添加授权的重定向 URI**
   
   在"已获授权的重定向 URI"部分添加以下两个地址：
   
   ```
   https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback
   https://0dca8f01.gggxiaoji.pages.dev
   ```
   
   如果你的 Pages 项目有自定义域名，也需要添加：
   ```
   https://gggxiaoji.pages.dev
   ```

4. **保存更改**
   - 点击"保存"按钮
   - 等待几分钟让更改生效

---

## 🧪 测试清单

完成 Google OAuth 配置后，请按以下顺序测试：

### 1. 测试 API 健康检查
```bash
curl https://xiaoji-game-api.weixinyongjiu.workers.dev/api/health
```
期望返回：`{"status":"ok"}`

### 2. 测试前端访问
- 访问 `https://0dca8f01.gggxiaoji.pages.dev`
- 检查页面是否正常加载

### 3. 测试 Google OAuth 登录
- 点击"使用 Google 登录"按钮
- 应该跳转到 Google 登录页面
- 授权后应该返回游戏页面并显示登录状态

### 4. 测试游戏功能
- ✅ 点击小鸡产蛋
- ✅ 查看库存
- ✅ 卖蛋换金币
- ✅ 购买升级
- ✅ 市场交易（创建订单、购买、取消）

### 5. 测试数据同步
- 登录后进行游戏操作
- 刷新页面检查数据是否保存
- 换个浏览器/设备登录同一账号，检查数据是否同步

---

## 📝 重要配置信息汇总

### API Worker
- **名称**: `xiaoji-game-api`
- **URL**: `https://xiaoji-game-api.weixinyongjiu.workers.dev`
- **版本**: v1
- **最新部署**: 2025-10-17

### Cloudflare Pages
- **项目名**: `gggxiaoji`
- **预览 URL**: `https://0dca8f01.gggxiaoji.pages.dev`
- **生产 URL**: `https://gggxiaoji.pages.dev`

### Supabase
- **项目 URL**: `https://rfckzemofzlbixicfnib.supabase.co`
- **数据库**: PostgreSQL
- **认证**: JWT Token

### Google OAuth
- **客户端 ID**: `874826851840-k34jj874i0q0s6e356pmhldejlgg9t2s.apps.googleusercontent.com`
- **客户端密钥**: `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` （已存储为 Worker 密钥）
- **回调 URL**: `https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback`

---

## 🚀 更新部署

### 更新 API
```bash
cd api
wrangler deploy
```

### 更新前端
Cloudflare Pages 会自动从 Git 仓库部署，或手动上传：
```bash
cd ..
npm run build
# 然后在 Cloudflare Dashboard 手动上传 dist 目录
```

### 更新密钥
```bash
echo "新的密钥值" | wrangler secret put SECRET_NAME
```

---

## 🔍 故障排查

### 如果 API 返回 500 错误
1. 检查 Worker 日志：Cloudflare Dashboard → Workers → xiaoji-game-api → Logs
2. 确认所有密钥都已正确配置：`wrangler secret list`
3. 检查 Supabase 数据库连接

### 如果 OAuth 登录失败
1. 确认 Google Cloud Console 中回调 URL 已添加
2. 检查 Browser 控制台是否有 CORS 错误
3. 验证 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正确

### 如果前端无法连接 API
1. 检查 `src/js/config.js` 中 `API_BASE_URL` 是否正确
2. 检查浏览器控制台网络请求
3. 确认 CORS 配置允许 Pages 域名

---

## 📞 支持

如遇问题：
1. 查看 Cloudflare Workers 实时日志
2. 查看浏览器开发者工具控制台
3. 检查 Supabase 项目状态
4. 参考 Cloudflare 和 Google OAuth 官方文档

---

**部署时间**: 2025-10-17  
**部署人员**: Warp AI Assistant  
**文档版本**: 1.0
