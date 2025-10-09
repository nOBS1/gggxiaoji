# 🔗 Supabase 集成设置指南

本项目使用 **Supabase PostgreSQL** 作为数据库后端。

---

## 📋 目录

1. [数据库初始化](#数据库初始化)
2. [环境配置](#环境配置)
3. [本地开发](#本地开发)
4. [测试连接](#测试连接)
5. [常见问题](#常见问题)

---

## 1️⃣ 数据库初始化

### 步骤 1: 在 Supabase 控制台创建数据库

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 打开你的项目: https://rfckzemofzlbixicfnib.supabase.co
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**

### 步骤 2: 执行数据库迁移脚本

复制 `migrations/supabase_init.sql` 文件中的所有内容，粘贴到 SQL 编辑器中。

点击 **Run** 执行脚本。

你应该看到成功创建了以下表：
- ✅ users
- ✅ profiles
- ✅ inventory
- ✅ upgrades
- ✅ stats
- ✅ daily_tasks
- ✅ ad_runs
- ✅ orders
- ✅ transactions

### 步骤 3: 验证触发器

在 SQL Editor 中运行：

```sql
-- 查看所有触发器
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

你应该看到 `after_user_insert` 和 `update_*_updated_at` 等触发器。

---

## 2️⃣ 环境配置

### 配置 .env 文件

项目根目录的 `api/.env` 文件已经创建好了，包含：

```env
# Supabase 配置
SUPABASE_URL=https://rfckzemofzlbixicfnib.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...（你的 API Key）

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 环境
NODE_ENV=development
```

⚠️ **重要安全提示：**
- `.env` 文件包含敏感信息，**不要提交到 Git**
- 已添加到 `.gitignore` 中
- 生产环境请使用更强的 JWT_SECRET

---

## 3️⃣ 本地开发

### 安装依赖

```bash
cd api
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将运行在: http://localhost:3001

### 测试 API

使用浏览器或 Postman 测试：

**健康检查：**
```
GET http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": 1704067200000,
  "version": "1.0.0"
}
```

---

## 4️⃣ 测试连接

### 测试注册功能

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid-here",
      "email": "test@example.com"
    }
  }
}
```

### 测试登录功能

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 测试受保护路由

```bash
curl -X GET http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept-Language: zh"
```

---

## 5️⃣ 常见问题

### Q1: 连接 Supabase 失败

**错误：** `Failed to connect to Supabase`

**解决方案：**
1. 检查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
2. 确保网络可以访问 Supabase
3. 查看 Supabase Dashboard 确认项目状态

### Q2: RLS (Row Level Security) 策略错误

**错误：** `new row violates row-level security policy`

**解决方案：**
当前我们使用 `anon` key，某些操作可能受 RLS 限制。有两种方案：

**方案 A（临时开发）：** 暂时禁用 users 表的 RLS
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**方案 B（推荐生产）：** 使用 Service Role Key
在 Supabase Dashboard → Settings → API 中找到 `service_role` key，添加到环境变量：
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Q3: 触发器未自动创建关联数据

**问题：** 注册用户后，profiles/inventory 等表没有数据

**解决方案：**
1. 检查触发器是否成功创建：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'after_user_insert';
```

2. 手动测试触发器：
```sql
-- 插入测试用户
INSERT INTO users (email, hashed_password) 
VALUES ('test@test.com', 'hashed_password_here');

-- 检查是否自动创建了关联数据
SELECT * FROM profiles WHERE user_id = (SELECT id FROM users WHERE email = 'test@test.com');
```

### Q4: 密码哈希不够安全

**问题：** 当前使用 SHA-256，不够安全

**解决方案：**
在生产环境中，更新 `src/utils/crypto.ts` 使用 bcrypt：

```typescript
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
```

安装依赖：
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## 🗄️ 数据库管理

### 查看所有表

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 查看用户数据

```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.nickname,
  p.coins
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;
```

### 清空所有数据（危险操作！）

```sql
TRUNCATE users CASCADE;
```

这会清空 users 表及所有关联表的数据（由于 CASCADE）。

---

## 📚 相关资源

- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Hono 文档](https://hono.dev/)
- [项目主 README](./README.md)

---

**状态:** ✅ 已配置完成  
**最后更新:** 2025-10-08
