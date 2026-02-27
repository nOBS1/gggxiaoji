# 🐣 小鸡点击游戏 API / Xiaoji Clicker Game API

基于 **Supabase PostgreSQL** + **Hono.js** 的后端 API 服务，支持中英文国际化。

Backend API service built on **Supabase PostgreSQL** + **Hono.js** with Chinese and English i18n support.

[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Framework](https://img.shields.io/badge/Framework-Hono.js-E36002?logo=hono)](https://hono.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 快速开始 / Quick Start

**只需 5 分钟！** 查看 → **[QUICKSTART.md](./QUICKSTART.md)**

或者直接按照以下步骤开始 / Or follow the steps below:

---

## 📋 功能特性 / Features

### 🔐 认证系统 / Authentication
- 用户注册/登录 / User registration and login
- JWT Token 身份验证 / JWT token authentication
- 密码加密存储 / Encrypted password storage

### 🎮 游戏核心 / Core Game Mechanics
- 点击获取鸡蛋 / Click to get eggs
- 稀有度系统 (白、棕、银、金、紫、黑) / Rarity system (white, brown, silver, gold, purple, black)
- 挂机收益 / Idle rewards
- 升级系统 / Upgrade system
- 每日任务 / Daily tasks

### 🏪 交易市场 / Trading Market
- 创建卖单 / Create sell orders
- 购买订单 / Buy orders
- 取消订单 / Cancel orders
- 交易记录查询 / Transaction history

### 👤 用户系统 / User System
- 个人资料管理 / Profile management
- 游戏设置 / Game settings
- 排行榜 / Leaderboard

---

## 🚀 快速开始 / Quick Start

### 1️⃣ 初始化数据库 / Initialize Database

**访问 Supabase Dashboard:**
1. 打开 https://rfckzemofzlbixicfnib.supabase.co
2. 点击 **SQL Editor** → **New Query**
3. 复制 `migrations/supabase_init.sql` 全部内容
4. 粘贴并点击 **Run** ▶️

**Visit Supabase Dashboard:**
1. Open https://rfckzemofzlbixicfnib.supabase.co
2. Click **SQL Editor** → **New Query**
3. Copy all content from `migrations/supabase_init.sql`
4. Paste and click **Run** ▶️

### 2️⃣ 安装依赖 / Install Dependencies

```bash
cd api
npm install
```

### 3️⃣ 配置环境变量 / Configure Environment

环境变量已配置在 `.env` 文件中：

Environment variables are configured in `.env` file:

```env
SUPABASE_URL=https://rfckzemofzlbixicfnib.supabase.co
SUPABASE_ANON_KEY=your_api_key_here
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

⚠️ **已配置完成，无需修改！** / Already configured, no changes needed!

### 4️⃣ 本地开发 / Local Development

```bash
npm run dev
```

API 将在 `http://localhost:3001` 运行。

API will run on `http://localhost:3001`.

### 5️⃣ 测试 API / Test API

```bash
# 健康检查 / Health check
curl http://localhost:3001/health

# 注册用户 / Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## 📡 API 端点 / API Endpoints

### 🔓 公开接口 / Public Endpoints

#### POST `/api/auth/register`
用户注册 / User registration

**请求体 / Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
用户登录 / User login

**请求体 / Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应 / Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  }
}
```

---

### 🔒 受保护接口 / Protected Endpoints

**所有受保护接口需要在请求头中包含 JWT Token：**

**All protected endpoints require JWT token in the request header:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**多语言支持 / Multi-language Support:**

```
Accept-Language: zh  (中文)
Accept-Language: en  (English)
```

---

### 🎮 游戏接口 / Game Endpoints

#### GET `/api/game/state`
获取游戏状态 / Get game state

**响应 / Response:**
```json
{
  "success": true,
  "data": {
    "profile": { "coins": 1000, "nickname": "Player1" },
    "inventory": [
      { "rarity": "white", "quantity": 10 }
    ],
    "upgrades": [
      { "upgrade_key": "level", "level": 5 }
    ],
    "stats": { "total_clicks": 500 },
    "tasks": []
  }
}
```

#### POST `/api/game/click`
处理点击事件 / Handle click event

#### POST `/api/game/sell`
卖出鸡蛋 / Sell eggs

**请求体 / Request Body:**
```json
{
  "rarity": "white",
  "quantity": 5
}
```

#### POST `/api/game/upgrade`
升级功能 / Upgrade feature

**请求体 / Request Body:**
```json
{
  "upgradeKey": "clickPower"
}
```

---

### 🏪 市场接口 / Market Endpoints

#### GET `/api/market/orders`
获取市场订单列表 / Get market orders

**查询参数 / Query Parameters:**
- `rarity` (可选): 稀有度筛选 / Rarity filter
- `limit` (可选): 返回数量，默认20 / Limit, default 20
- `offset` (可选): 偏移量，默认0 / Offset, default 0

#### POST `/api/market/create-order`
创建卖单 / Create sell order

**请求体 / Request Body:**
```json
{
  "rarity": "gold",
  "quantity": 3,
  "priceCoins": 500
}
```

#### POST `/api/market/buy-order`
购买订单 / Buy order

**请求体 / Request Body:**
```json
{
  "orderId": "order_id_here"
}
```

#### POST `/api/market/cancel-order`
取消订单 / Cancel order

#### GET `/api/market/my-orders`
获取我的订单 / Get my orders

#### GET `/api/market/transactions`
获取交易记录 / Get transaction history

---

### 👤 用户接口 / Profile Endpoints

#### GET `/api/profile`
获取个人资料 / Get profile

#### PUT `/api/profile`
更新个人资料 / Update profile

**请求体 / Request Body:**
```json
{
  "nickname": "NewNickname",
  "avatar": "avatar_url"
}
```

#### PUT `/api/profile/settings`
更新设置 / Update settings

**请求体 / Request Body:**
```json
{
  "soundEnabled": true,
  "language": "zh"
}
```

#### GET `/api/profile/leaderboard`
获取排行榜 / Get leaderboard

---

## 📦 数据库结构 / Database Schema

### 核心表 / Core Tables (9 张表)

| 表名 | 说明 | 主键类型 |
|------|------|----------|
| **users** | 用户认证信息 / User authentication | UUID |
| **profiles** | 用户资料 / User profiles | UUID (FK) |
| **inventory** | 鸡蛋库存 / Egg inventory | Serial |
| **upgrades** | 升级信息 / Upgrades | Serial |
| **stats** | 游戏统计 / Game statistics | UUID (FK) |
| **daily_tasks** | 每日任务 / Daily tasks | Serial |
| **ad_runs** | 广告记录 / Ad records | UUID (FK) |
| **orders** | 市场订单 / Market orders | UUID |
| **transactions** | 交易记录 / Transaction history | UUID |

### PostgreSQL 特性 / PostgreSQL Features

- ✅ UUID 主键自动生成 / Auto-generated UUID primary keys
- ✅ TIMESTAMPTZ 时间戳 / Timestamp with timezone
- ✅ 自动更新触发器 / Auto-update triggers
- ✅ 用户注册触发器 / User registration triggers
- ✅ Row Level Security (RLS) 策略 / RLS policies

详细的 SQL Schema 请查看 `migrations/supabase_init.sql`。

For detailed SQL schema, see `migrations/supabase_init.sql`.

---

## 🔧 技术栈 / Tech Stack

- **Database**: Supabase PostgreSQL 15
- **Backend Framework**: Hono.js
- **Runtime**: Node.js (Development) / Cloudflare Workers (Optional)
- **Language**: TypeScript
- **Authentication**: JWT (jose library)
- **ORM/Client**: @supabase/supabase-js
- **ID Generation**: UUID (PostgreSQL) + nanoid

---

## 📝 开发说明 / Development Notes

### 当前状态 / Current Status

**已完成 / Completed:**
- ✅ Supabase PostgreSQL 集成 / Supabase PostgreSQL integration
- ✅ 数据库 Schema 设计 / Database schema design
- ✅ 认证系统 (JWT) / Authentication system (JWT)
- ✅ 用户注册/登录 / User registration/login
- ✅ 中英文国际化 / Chinese/English i18n
- ✅ API 路由框架 / API routes framework

**待实现 / TODO:**
- ⏳ 游戏路由改造 (Supabase) / Game routes migration (Supabase)
- ⏳ 市场路由改造 (Supabase) / Market routes migration (Supabase)
- ⏳ 用户路由改造 (Supabase) / Profile routes migration (Supabase)
- ⏳ 点击事件逻辑 / Click event logic
- ⏳ 卖出鸡蛋逻辑 / Sell eggs logic
- ⏳ 升级系统逻辑 / Upgrade system logic
- ⏳ 市场交易逻辑 / Market trading logic

### 安全建议 / Security Recommendations

⚠️ **重要 / Important:**

1. **密码加密 / Password Hashing:**
   - 当前使用 SHA-256 (仅供开发) / Currently using SHA-256 (dev only)
   - 生产环境建议使用 bcrypt 或 argon2 / Use bcrypt or argon2 in production
   - 安装：`npm install bcryptjs @types/bcryptjs`

2. **JWT 密钥 / JWT Secret:**
   - 请修改 `.env` 中的 `JWT_SECRET` / Please change `JWT_SECRET` in `.env`
   - 使用强随机字符串 / Use strong random string

3. **Supabase RLS / Row Level Security:**
   - 已配置 RLS 策略 / RLS policies are configured
   - 开发环境可以禁用以方便测试 / Can disable for dev testing

### 相关文档 / Related Documentation

- 🚀 [5分钟快速开始](./QUICKSTART.md) - 推荐先看 / Recommended first read
- 🔧 [详细配置指南](./SUPABASE_SETUP.md) - 问题排查 / Troubleshooting
- 🎉 [集成完成报告](../SUPABASE_INTEGRATION_COMPLETE.md) - 完整总结 / Complete summary

---

## 🌐 多语言支持 / Multi-language Support

API 通过 `Accept-Language` 请求头自动识别用户语言：

API automatically detects user language via `Accept-Language` header:

```bash
# 中文请求 / Chinese request
curl -H "Accept-Language: zh" http://localhost:3001/api/...

# 英文请求 / English request
curl -H "Accept-Language: en" http://localhost:3001/api/...
```

**错误消息示例 / Error Message Examples:**

```json
// Accept-Language: zh
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未授权，请先登录"
  }
}

// Accept-Language: en
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized. Please login first."
  }
}
```

默认为英文 / Default: English

---

## 📄 许可证 / License

MIT License

---

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！

Issues and Pull Requests are welcome!

---

---

## 📈 版本信息 / Version Info

| 项目 | 信息 |
|------|------|
| **版本 / Version** | 1.0.0 |
| **数据库 / Database** | Supabase PostgreSQL 15 |
| **后端框架 / Backend** | Hono.js 4.7 |
| **语言 / Language** | TypeScript 5.7 |
| **状态 / Status** | 🚧 开发中 / In Development |
| **最后更新 / Updated** | 2025-10-08 |

---

## 👥 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！

Issues and Pull Requests are welcome!

---

## 📝 许可证 / License

MIT License

---

**作者 / Author:** AI Assistant  
**项目 / Project:** 小鸡点击游戏 v3.0 / Xiaoji Clicker Game v3.0  
**技术支持 / Powered by:** Supabase + Hono.js
