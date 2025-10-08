后续更新mod

**整体规划**

- 建议升级为前后端分离架构：前端仍保持 Vite/Cloudflare Pages 部署，后端新增 Cloudflare Workers（或 Supabase Edge Functions）作为 API 层，负责游戏状态、交易和鉴权；数据库选 Cloudflare D1（轻便、低延迟）或 Supabase Postgres（功能丰富）均可。
- 用户系统需要支持注册/登录（建议 OAuth + JWT）。非登录用户仅能试玩；正式账户的数据与交易记录全部落库，同时保留本地存档做缓存。
- 游戏状态从本地 state.js 迁移至后端：前端定期调用 API 获取/更新进度；离线收益、任务、广告冷却等逻辑由后端计算，避免被篡改。
- 金蛋/黑蛋商城交易：设计拍卖行或点对点订单表，全部金额使用游戏金币结算；必须有库存校验、交易撮合、手续费与反作弊（防止刷子、脚本）。所有交易操作写入事务日志，便于审计与回滚。
- 安全基础：所有请求经鉴权中间件；对前端导入存档的逻辑施行服务端验证；对关键接口加速率限制、签名防重复提交。

**数据库示例（Cloudflare D1/Supabase）**

- users: id, email, hashed_password, created_at, last_login。
- profiles: user_id, nickname, avatar, language, sound_enabled 等偏好。
- inventory: user_id, rarity, quantity, updated_at。
- upgrades: user_id, upgrade_key, level。
- stats: user_id, total_clicks, idle_accumulator, last_idle_tick 等。
- orders: id, seller_id, rarity, quantity, price_coins, status(open/sold/cancelled), created_at。
- transactions: id, buyer_id, seller_id, order_id, rarity, quantity, price_total, fee, created_at。
- daily_tasks: user_id, task_key, progress, claimed, date。
- 如需广告或签到，可追加 ad_runs, login_rewards 等表。

**后端 API 要点**

- POST /auth/login, POST /auth/register（Supabase 可托管）。
- GET /state, POST /state：读取/写入核心状态，进行服务器端校验。
- POST /click, POST /idle：按当前升级计算收益，防止客户端作弊。
- GET /orders, POST /orders, POST /orders/{id}/buy, POST /orders/{id}/cancel：商城交易。
- GET /tasks, POST /tasks/{id}/claim：每日任务。
- POST /ads/watch：广告奖励（记录冷却与上限）。
- 所有修改金币与库存的 API 必须使用数据库事务，成功后再返回给前端。

**人对人交易流程**

- 卖家创建订单：检查库存 → 冻结对应鸡蛋数量 → 写入 orders。
- 买家购买：校验订单状态与剩余数量 → 扣金币（含平台税） → 发放鸡蛋 → 更新订单与交易日志 → 通知双方。
- 取消订单仅允许卖家在未售出状态执行，需释放冻结库存。
- 建议设置最低价、手续费以及交易限额，结合风控（例如短时间内大量订单需人工/自动审核）。

**部署流水线（GitHub Actions）**

1. pnpm install / npm ci → npm run build 前端。
2. 使用 Cloudflare Pages Action (cloudflare/pages-action) 上传构建产物。
3. 后端 Worker/Edge Function 构建后使用 wrangler publish（Cloudflare）或 supabase functions deploy。
4. 测试阶段可添加 npm run test（前端）和 API 集成测试（使用 wrangler dev 或 Supabase CLI）。
5. 生产部署前的数据库迁移：对 D1 运行 wrangler d1 migrations apply；对 Supabase 使用 supabase db push。

**前端调整建议**

- 改造 state.js：改为薄层缓存，仅在登录后从 API 拉取数据，离线模式下可退回本地玩法，但数据不写入云端。
- 将所有 saveGame()、loadGame()、任务/广告/商城逻辑改为通过 API 调用；在 UI 显示实时状态并处理返回错误（库存不足、金币不足等）。
- 新增交易界面：展示订单列表、上架表单、成交历史等，并对订单状态进行轮询或基于 WebSocket/Server-Sent Events 实时更新。
- 对敏感操作（上架、购买、重置）加二次确认。

**后续工作优先级**

1. 设计数据库表与 API 契约；搭建后端基础。
2. 重构前端状态管理 → 改用 API 驱动。
3. 实装用户系统与安全机制（鉴权、限流、审计日志）。
4. 实现商城交易流程与 UI，完成端到端测试。
5. 搭建 CI/CD（Actions + Pages + Workers/Functions）及数据库迁移流程。
6. 优化性能（资源压缩、懒加载）、多语言与错误提示，准备上线文档与监控。

这样可保证游戏上线后具备在线存档、可扩展的交易系统以及稳定的自动化部署链路。