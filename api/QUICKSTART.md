# 🚀 快速开始指南

5分钟内完成 Supabase 后端配置并运行！

---

## ✅ 第一步：初始化数据库

### 1. 打开 Supabase SQL 编辑器

访问：https://rfckzemofzlbixicfnib.supabase.co
点击左侧 **SQL Editor** → **New Query**

### 2. 执行数据库脚本

复制 `migrations/supabase_init.sql` 的全部内容，粘贴到编辑器中。

点击 **Run** ▶️

✅ 成功后应该看到创建了 9 张表和多个触发器。

---

## ✅ 第二步：安装依赖

打开终端，进入 api 目录：

```bash
cd api
npm install
```

这会安装：
- ✅ @supabase/supabase-js - Supabase 客户端
- ✅ hono - Web 框架
- ✅ jose - JWT 处理
- ✅ dotenv - 环境变量管理

---

## ✅ 第三步：配置环境变量

`.env` 文件已经创建好了，包含：

```env
SUPABASE_URL=https://rfckzemofzlbixicfnib.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

✅ **已配置完成，无需修改！**

⚠️ 注意：生产环境请更改 `JWT_SECRET`

---

## ✅ 第四步：启动服务器

```bash
npm run dev
```

你应该看到：

```
🚀 启动服务器在端口 3001...
📍 API 地址: http://localhost:3001
🗄️  Supabase: https://rfckzemofzlbixicfnib.supabase.co
```

---

## ✅ 第五步：测试 API

### 测试健康检查

在浏览器中打开：
```
http://localhost:3001/health
```

应该看到：
```json
{
  "status": "ok",
  "timestamp": 1704067200000,
  "version": "1.0.0"
}
```

### 测试注册用户

使用 Postman、Thunder Client 或 curl：

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

成功响应：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test@example.com"
    }
  }
}
```

### 测试登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## ✅ 第六步：验证数据库

### 在 Supabase 查看数据

1. 打开 Supabase Dashboard
2. 点击 **Table Editor**
3. 选择 `users` 表

你应该看到刚才注册的用户！

### 检查关联表

同时检查这些表，触发器应该自动创建了数据：
- ✅ `profiles` - 用户资料
- ✅ `inventory` - 库存（6种稀有度，初始为0）
- ✅ `upgrades` - 升级（7种，初始为0或1）
- ✅ `stats` - 游戏统计
- ✅ `ad_runs` - 广告记录

---

## 🎯 完成！

现在你的 Supabase 后端已经完全配置好了！

### 下一步做什么？

1. **实现游戏逻辑** - 完善 `routes/game.ts` 中的 TODO 部分
2. **实现交易系统** - 完善 `routes/market.ts` 中的 TODO 部分
3. **前端集成** - 创建前端 API 客户端连接后端
4. **测试和部署** - 编写测试并部署到生产环境

---

## 🆘 遇到问题？

### RLS 策略错误

如果看到 `row-level security policy` 错误，在 SQL Editor 运行：

```sql
-- 临时禁用 users 表的 RLS（仅开发环境）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 触发器未生效

检查触发器是否创建：

```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### 无法连接 Supabase

1. 检查网络连接
2. 验证 `.env` 文件中的 URL 和 Key
3. 确认 Supabase 项目状态正常

---

## 📚 更多文档

- 📖 [详细设置指南](./SUPABASE_SETUP.md)
- 📖 [API 文档](./README.md)
- 🌐 [Supabase 官方文档](https://supabase.com/docs)

---

**状态:** ✅ 配置完成  
**用时:** ~5 分钟  
**版本:** 1.0.0
