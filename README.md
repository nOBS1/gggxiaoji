# 🐔 鸡蛋模拟器 (Egg Simulator)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Backend-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)

> 🎮 一款轻松有趣的挂机点击游戏，支持玩家间交易、多设备同步，全球 CDN 加速。

一款轻度挂机网页小游戏 - 完整前后端分离架构，支持市场交易和国际化

## ✨ 特性

### 🎮 核心游戏
- **简单易玩** - 点击小鸡啄米产蛋
- **6种稀有度蛋** - 白/棕/银/金/紫/黑
- **升级系统** - 小鸡等级、饲料品质、强力啄、被动效率
- **完整背包系统** - 蛋类收集和管理

### 🛒 市场交易系统 (V3新增)
- **买卖蛋类** - 实时市场价格系统
- **市场大厅** - 查看所有玩家的交易
- **智能定价** - 基于稀有度的动态价格
- **交易历史** - 完整的买卖记录

### 🌍 国际化支持
- **完整中英文** - 界面、提示、错误消息全覆盖
- **动态切换** - 实时语言切换无需刷新
- **本地化体验** - 符合不同文化的用户习惯

### 🔧 技术特性
- **Supabase后端** - 完整的数据库和API支持
- **实时同步** - 多设备数据同步
- **安全认证** - 匿名用户系统
- **错误处理** - 完善的错误提示和恢复
- **响应式设计** - 完美支持桌面和移动端

## 🏢️ 项目结构

```
xiaoji-game/
├── src/
│   ├── js/
│   │   ├── config.js       # 游戏配置和常量
│   │   ├── i18n.js         # 国际化系统
│   │   ├── main.js         # 主游戏逻辑
│   │   ├── auth-simple.js  # 用户认证系统
│   │   └── market.js       # 市场交易系统
│   └── css/
│       ├── style.css       # 主样式文件
│       └── market.css      # 市场界面样式
├── api/                    # 后端 API
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── utils/          # 工具函数
│   │   └── middleware/     # 中间件
│   └── migrations/         # 数据库迁移
├── docs/                   # 项目文档
├── index.html              # 主HTML文件
├── package.json            # 项目配置
└── README.md               # 项目文档
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- 现代浏览器 (支持 ES6+)
- Cloudflare 账号 (部署用)
- Supabase 账号 (数据库)

### 在线体验

🎮 **立即试玩**: [https://xiaoji-game.pages.dev](https://xiaoji-game.pages.dev)

### 本地开发

#### 1. 克隆项目

```bash
git clone <repository-url>
cd xiaoji-game
```

#### 2. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd api
npm install
cd ..
```

#### 3. 配置环境变量

在 `api/` 目录创建 `.env` 文件：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key
```

#### 4. 启动开发服务器

```bash
# 终端 1: 启动前端
npm run dev

# 终端 2: 启动后端 API
cd api
npm run dev
```

前端: http://localhost:5173  
后端: http://localhost:8787

### 🚢 部署到 Cloudflare

#### 一键部署

```powershell
# Windows PowerShell
.\deploy.ps1
```

#### 手动部署

```bash
# 1. 登录 Cloudflare
cd api
npx wrangler login

# 2. 配置密钥
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put JWT_SECRET

# 3. 部署后端
npm run deploy

# 4. 构建并部署前端
cd ..
npm run build
npx wrangler pages deploy dist --project-name xiaoji-game
```

📚 **详细部署指南**: [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)

## 🎯 游戏玩法

### 🐔 基础游戏
1. **点击小鸡** - 累积进度，100%产出1个蛋
2. **被动产蛋** - 每分钟自动产出（可升级）
3. **背包管理** - 查看和管理你的蛋类收藏
4. **升级系统** - 使用鸡蛋升级各项属性

### 🛒 市场交易系统
1. **创建订单** - 出售紫蛋、金蛋、黑蛋（限定可交易蛋类）
2. **购买蛋类** - 从市场购买其他玩家的订单
3. **筛选排序** - 按稀有度筛选，按价格/时间排序
4. **我的订单** - 管理和取消自己的订单
5. **交易记录** - 完整的买卖历史追踪
6. **市场统计** - 实时活跃订单数和交易量
7. **手续费系统** - 5% 平台手续费

### 🌍 国际化体验
- **语言切换** - 右上角一键切换中英文
- **本地化界面** - 所有文本和提示均支持双语
- **数据持久** - 语言选择自动保存

## 📊 稀有度系统

| 稀有度 | 图标 | 价格 | 基础权重 |
|--------|------|------|----------|
| 白蛋   | 🥚  | 1💰  | 82%      |
| 棕蛋   | 🥜  | 2💰  | 12%      |
| 银蛋   | ⚪  | 5💰  | 4.3%     |
| 金蛋   | 🥇  | 15💰 | 1.3%     |
| 紫蛋   | 🟣  | 40💰 | 0.35%    |
| 黑蛋   | ⚫  | 200💰| 0.05%    |

*权重会随等级和饲料提升而变化*

## 🔧 技术栈

### 🌐 前端
- **框架**: 原生 JavaScript (ES6+) + Vite
- **样式**: 原生 CSS3 + CSS Variables
- **国际化**: 自定义 i18n 系统 (中英文)
- **响应式**: Flexbox + Grid 布局
- **动画**: CSS Transitions + Animations
- **构建**: Vite 5.0

### 🔐 后端 API
- **框架**: Hono (快速、轻量的 Web 框架)
- **运行时**: Cloudflare Workers
- **语言**: TypeScript
- **认证**: JWT + bcrypt
- **中间件**: CORS, 错误处理, 身份验证

### 💾 数据库
- **主库**: Supabase (PostgreSQL)
- **表设计**: users, profiles, inventory, upgrades, orders, transactions
- **RPC 函数**: 原子性交易操作
- **索引优化**: 查询性能优化

### ☁️ 部署
- **前端**: Cloudflare Pages (全球 CDN)
- **后端**: Cloudflare Workers (边缘计算)
- **数据库**: Supabase (托管 PostgreSQL)
- **域名**: 自定义域名支持

### 🛠️ 开发工具
- **包管理**: npm
- **版本控制**: Git
- **部署工具**: Wrangler CLI
- **API 测试**: 内置测试脚本

## 📦 部署架构

```
用户浏览器
    ↓
Cloudflare Pages (前端)
    ↓ API 请求
Cloudflare Workers (后端)
    ↓ 数据查询
Supabase (PostgreSQL)
```

### 🚀 推荐部署方式

**Cloudflare Pages + Workers**（免费额度充足）

#### 优点
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 免费额度: 100K 请求/天
- ✅ 零配置 CORS
- ✅ 一键部署

#### 部署步骤

1. **部署后端**
   ```bash
   cd api
   npx wrangler login
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   npx wrangler secret put JWT_SECRET
   npm run deploy
   ```

2. **部署前端**
   ```bash
   cd ..
   npm run build
   npx wrangler pages deploy dist --project-name xiaoji-game
   ```

3. **更新 API URL**
   - 在 `src/js/config.js` 中设置 Workers URL
   - 重新构建和部署前端

📚 **完整指南**: [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)

### 🌍 其他部署选项

- **Vercel**: 前端 + Serverless Functions
- **Netlify**: 前端 + Edge Functions
- **AWS**: S3 + Lambda
- **自托管**: Docker + Nginx

## 🎨 自定义

### 修改游戏配置

编辑 `src/js/config.js` 修改：
- 稀有度权重
- 升级成本
- 游戏平衡性参数

### 添加新语言

编辑 `src/js/i18n.js` 添加新的语言对象。

### 修改样式

编辑 `src/css/` 目录下的CSS文件自定义外观。

## 📋 项目状态

### ✅ 已完成功能 (v3.0)

#### 核心游戏 (100%)
- [x] 点击产蛋机制
- [x] 6 种稀有度蛋系统
- [x] 被动产蛋系统
- [x] 升级系统 (7 种升级)
- [x] 背包管理
- [x] 商店系统
- [x] 每日任务
- [x] 保底机制

#### 市场交易 (100%)
- [x] 创建订单（限定紫/金/黑蛋）
- [x] 购买订单
- [x] 取消订单
- [x] 订单筛选和排序
- [x] 交易记录
- [x] 市场统计
- [x] 手续费系统
- [x] 并发控制

#### 用户系统 (100%)
- [x] 注册/登录
- [x] JWT 认证
- [x] 本地数据同步
- [x] 多设备同步
- [x] 会话管理

#### UI/UX (95%)
- [x] 响应式设计
- [x] 移动端适配
- [x] 国际化 (中英文)
- [x] 暗色主题
- [x] 错误提示
- [x] 加载状态
- [ ] 分页导航 UI

#### 技术架构 (100%)
- [x] 前后端分离
- [x] TypeScript 后端
- [x] PostgreSQL 数据库
- [x] RPC 原子操作
- [x] 索引优化
- [x] CORS 配置
- [x] 错误处理
- [x] 安全验证

#### 部署 (100%)
- [x] Cloudflare Workers 配置
- [x] Cloudflare Pages 配置
- [x] 一键部署脚本
- [x] 环境变量管理
- [x] 构建优化

### 📊 总体完成度: **97%**

### 🎯 待优化功能

#### 短期优化 (P1)
- [ ] 订单列表分页 UI
- [ ] 自动刷新/轮询
- [ ] 手续费说明优化
- [ ] 错误提示改进

#### 中期功能 (P2)
- [ ] 订单搜索功能
- [ ] 价格走势图
- [ ] WebSocket 实时推送
- [ ] 性能监控

#### 长期规划 (P3)
- [ ] 成就系统
- [ ] 好友系统
- [ ] 排行榜
- [ ] PWA 支持
- [ ] 拍卖系统

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

Your Name

---

## 📚 文档

- [完整部署指南](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)
- [第三期工程进度报告](./PHASE3_PROGRESS_REPORT.md)
- [市场可交易蛋类型说明](./MARKET_TRADABLE_EGGS_UPDATE.md)
- [交易记录查询修复](./TRANSACTIONS_FIX.md)
- [本地数据同步说明](./docs/LOCAL_DATA_SYNC.md)

## 🆕 版本历史

### v3.0 (2025-10-11) - 市场交易系统

#### 🎉 新功能
- ✨ 完整的市场交易系统
- ✨ 限定可交易蛋类型（紫/金/黑）
- ✨ 交易记录追踪
- ✨ 市场统计展示
- ✨ 本地数据自动同步

#### 🔧 技术改进
- 🚀 迁移到 Cloudflare Workers
- 🚀 前后端完全分离
- 🚀 TypeScript 重写后端
- 🚀 数据库 RPC 函数优化
- 🚀 CORS 配置完善

#### 🐛 Bug 修复
- 🔧 修复交易记录查询错误
- 🔧 修复市场统计显示问题
- 🔧 修复筛选功能
- 🔧 修复图片路径问题

### v2.2 (2025-10-10) - UI 优化
- 🎨 新增真实音效
- 🎨 替换真实图片资源
- 🌍 完善国际化支持
- 📱 移动端适配改进

### v2.1 (2025-01-07)
- 🌍 国际化系统
- 👤 用户认证
- 💾 云端数据同步

### v2.0 (2024-12-30)
- 🎮 核心游戏机制
- 🐔 小鸡点击系统
- 🥚 蛋类收集
- ⬆️ 升级系统

---

**享受游戏！Have fun! 🎮🐔🥚**
