# 后端部署说明

## 最新更改

✅ **允许未登录用户访问市场** - 修改了 `api/src/index.ts`

### 修改内容：
- `/api/market/orders` - 现在允许匿名访问
- `/api/market/stats` - 现在允许匿名访问
- 其他市场操作（创建订单、购买订单等）仍需要登录

## 部署步骤

### 方式 1: 使用 Wrangler CLI（推荐）

```bash
cd api
wrangler deploy
```

### 方式 2: 通过 Cloudflare Dashboard

1. 访问 https://dash.cloudflare.com/
2. 进入 Workers & Pages
3. 找到你的 Worker（xiaoji-game-api）
4. 上传新的代码

## 验证部署

部署后，测试以下URL（不需要登录）：

```bash
# 测试市场订单列表
curl https://xiaoji-game-api.weixinyongjiu.workers.dev/api/market/orders

# 测试市场统计
curl https://xiaoji-game-api.weixinyongjiu.workers.dev/api/market/stats
```

应该返回 200 状态码，而不是 401。

## 本地测试

如果要在本地测试：

```bash
cd api
npm run dev
```

然后访问：
- http://localhost:8787/api/market/orders
- http://localhost:8787/api/market/stats

## 问题排查

### 如果还是返回 401：
1. 确保已经重新部署
2. 清除浏览器缓存
3. 检查 Cloudflare Workers 日志

### 查看日志：
```bash
wrangler tail
```

## 前端配置

前端无需修改，只需要后端部署完成即可。

访问 http://localhost:3000/market 应该能看到市场订单了！
