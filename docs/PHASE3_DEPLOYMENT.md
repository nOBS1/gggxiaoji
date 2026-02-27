# 第三期市场交易系统 - 快速部署指南

## 🚀 立即部署步骤

### 第一步：部署数据库 RPC 函数 🔴 **必须**

**方式 1: Supabase Dashboard（推荐）**

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/rfckzemofzlbixicfnib/sql/new

2. 复制完整 SQL 文件内容:
   ```bash
   # 文件位置
   api/migrations/0003_market_functions_complete.sql
   ```

3. 粘贴到 SQL Editor 并点击 "Run"

4. 验证函数是否创建成功:
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname LIKE '%market%'
   ORDER BY proname;
   ```
   
   应该看到:
   - buy_market_order
   - cancel_market_order
   - create_market_order
   - get_market_stats

**方式 2: 使用测试脚本验证**

```bash
cd api
node deploy-rpc-functions.js
```

如果看到 `✅ RPC 函数已成功部署！` 和市场统计数据，说明部署成功。

---

### 第二步：验证 profiles 表结构 🟡 **重要**

1. 在 Supabase SQL Editor 中执行:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles'
   ORDER BY ordinal_position;
   ```

2. 确认包含以下字段:
   - `user_id` (uuid)
   - `nickname` (text)
   - `avatar` (text, nullable)
   - `coins` (integer)
   - `peck_progress` (integer) ⬅️ **重要**
   - `black_pity_counter` (integer) ⬅️ **重要**
   - `sound_enabled` (boolean)
   - `language` (text)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

3. 如果缺少 `peck_progress` 或 `black_pity_counter` 字段:
   ```sql
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS peck_progress INTEGER DEFAULT 0;

   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS black_pity_counter INTEGER DEFAULT 0;
   ```

---

### 第三步：重启后端服务器 🟢 **推荐**

```bash
# 停止旧的服务器进程（如果正在运行）
# Windows PowerShell:
Get-Process -Name node | Where-Object {$_.Path -like "*xiaoji-game*"} | Stop-Process

# 或者找到 PID 并停止:
netstat -ano | findstr :8787
# 记下 PID（例如 34168）
taskkill /PID 34168 /F

# 重新启动服务器
cd api
npm run dev
```

验证服务器启动成功:
```bash
curl http://localhost:8787/health
# 应该返回: {"status":"ok","timestamp":...}
```

---

### 第四步：重新构建前端 🟢 **推荐**

```bash
cd ..  # 回到项目根目录
npm run build
```

---

### 第五步：测试市场功能 ✅ **必须**

#### 5.1 准备测试数据

给用户添加测试库存:
```bash
cd api
node add-test-eggs.js 1
```

应该看到:
```
✅ Added 10 brown eggs
✅ Added 5 white eggs
```

#### 5.2 测试创建订单

在浏览器中:
1. 打开游戏: `http://localhost:3000`（或你的前端地址）
2. 登录账号: `1@123.com` / `123456`
3. 打开市场界面
4. 尝试创建订单:
   - 选择稀有度: brown
   - 数量: 2
   - 价格: 200

应该看到: "订单创建成功！"

#### 5.3 验证订单列表

刷新市场界面，应该能看到刚创建的订单。

#### 5.4 测试本地数据同步

1. **清空当前登录状态**:
   ```js
   // 在浏览器控制台执行
   localStorage.removeItem('auth_token');
   localStorage.removeItem('user_info');
   location.reload();
   ```

2. **在未登录状态下玩游戏**:
   - 点击小鸡几次，获得一些蛋
   - 卖出蛋，获得金币
   
3. **检查本地数据**:
   ```js
   JSON.parse(localStorage.getItem('xiaoji_game_save'))
   // 应该看到 eggs 和 coins 数据
   ```

4. **登录账号**:
   - 观察控制台，应该看到:
     ```
     [同步] 开始同步本地数据到服务器...
     [同步] 本地数据同步成功！
     ```

5. **刷新页面**:
   - 数据应该保留，说明同步成功！

---

## 🔍 故障排查

### 问题 1: RPC 函数未找到

**症状**: 
```
Error: function "create_market_order" does not exist
```

**解决**:
重新部署 RPC 函数（参考第一步）

### 问题 2: 创建订单返回 500 错误

**症状**:
```json
{"success": false, "error": {"code": "DATABASE_ERROR", "message": "数据库错误"}}
```

**可能原因**:
1. 用户库存不足
2. profiles 表缺少必需字段
3. RPC 函数版本不对

**排查步骤**:

1. 检查用户库存:
   ```bash
   node api/add-test-eggs.js <用户昵称>
   ```

2. 检查后端日志:
   ```
   [Market Create Order] RPC result: {...}
   ```

3. 手动测试 RPC:
   ```sql
   SELECT create_market_order(
     'your-user-id'::UUID,
     gen_random_uuid(),
     'brown',
     2,
     200
   );
   ```

### 问题 3: 本地数据未同步

**症状**:
登录后库存还是空的。

**排查步骤**:

1. 检查本地数据是否存在:
   ```js
   localStorage.getItem('xiaoji_game_save')
   ```

2. 检查前端控制台日志:
   ```
   [同步] 开始同步本地数据到服务器...
   ```

3. 检查后端日志:
   ```
   [Sync Local Data] User: ...
   [Sync] Updated brown eggs: ...
   ```

4. 手动给用户添加库存:
   ```bash
   node api/add-test-eggs.js <昵称>
   ```

---

## ✅ 部署验证清单

完成以下检查，确保部署成功:

### 数据库
- [ ] RPC 函数已部署（4 个）
- [ ] profiles 表结构完整
- [ ] orders 和 transactions 表存在
- [ ] 索引创建成功

### 后端 API
- [ ] `/health` 返回 200
- [ ] `/api/market/orders` 返回订单列表
- [ ] `/api/market/stats` 返回统计数据
- [ ] 创建订单成功
- [ ] 购买订单成功
- [ ] 取消订单成功

### 前端 UI
- [ ] 市场界面正常显示
- [ ] 订单列表加载成功
- [ ] 创建订单表单可用
- [ ] 交易历史显示正常
- [ ] 本地数据同步成功

### 功能测试
- [ ] 未登录无法访问市场
- [ ] 库存不足时无法创建订单
- [ ] 金币不足时无法购买订单
- [ ] 不能购买自己的订单
- [ ] 取消订单后库存正确退还
- [ ] 登录时本地数据自动同步

---

## 📊 监控建议

部署后，持续监控以下指标:

### 性能指标
- API 响应时间（目标 < 500ms）
- 订单创建成功率（目标 > 95%）
- 交易完成成功率（目标 > 98%）

### 业务指标
- 每日新增订单数
- 每日成交订单数
- 平均订单价格
- 各稀有度订单分布

### 错误监控
- DATABASE_ERROR 错误频率
- INSUFFICIENT_INVENTORY 错误频率
- INSUFFICIENT_COINS 错误频率
- 订单并发冲突次数

---

## 🎯 下一步

部署成功后，可以考虑以下优化:

### 短期（1-2 周）
1. 前端错误提示优化
2. 添加市场手续费说明
3. 实现订单列表分页
4. 添加自动刷新（轮询）

### 中期（1 个月）
1. 订单搜索功能
2. 价格走势图
3. 市场推荐系统
4. WebSocket 实时推送

### 长期（后续版本）
1. 拍卖系统
2. 交易聊天
3. 信用评级系统
4. 交易保护机制

---

## 📞 支持

如遇到问题:
1. 查看 [代码审计报告](./PHASE3_AUDIT_REPORT.md)
2. 查看 [本地数据同步文档](./LOCAL_DATA_SYNC.md)
3. 检查后端和前端日志
4. 联系开发团队

---

**最后更新**: 2025-01-10
**部署版本**: v3.0
