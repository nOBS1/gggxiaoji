# 🚀 快速启动指南

## 立即开始测试

### 1. 启动服务器（如果还没启动）

```bash
npm run dev
```

等待看到：
```
VITE v5.4.20  ready in 595 ms
➜  Local:   http://localhost:3000/
```

### 2. 打开自动化测试页面

在浏览器中访问：**http://localhost:3000/test-automation.html**

### 3. 开始测试

点击"**打开游戏**"按钮 → 会在新窗口打开游戏

等待 2 秒后，日志开始自动显示 ✨

点击"**运行测试**"按钮 → 自动测试所有功能

### 4. 查看结果

- 📊 顶部显示日志统计
- 📝 底部实时显示最新日志（最多100条）
- ❌ 红色表示错误
- ⚠️ 黄色表示警告
- ✅ 青色表示正常信息

### 5. 导出日志

点击"**导出日志**"按钮 → 下载 txt 文件

## 测试路由功能

现在可以直接在地址栏输入以下URL测试路由：

```
http://localhost:3000/backpack
http://localhost:3000/market
http://localhost:3000/shop
```

页面会自动切换到对应标签页！

## 验证市场功能（无需登录）

1. 直接访问：http://localhost:3000/market
2. 不登录就能看到市场订单列表
3. 可以筛选、排序、查看统计
4. **只有购买和创建订单需要登录**

## 在浏览器控制台使用日志

按 F12 打开控制台，输入：

```javascript
// 查看所有日志
_logger.getLogs()

// 只看错误
_logger.filterLogs('ERROR')

// 搜索"market"相关日志
_logger.filterLogs(null, 'market')

// 导出日志到文件
_exportLogs()

// 查看统计
_logger.getStats()
```

## 常见场景

### 场景 1：发现一个bug，想要日志

1. 打开测试面板：http://localhost:3000/test-automation.html
2. 点击"打开游戏"
3. 重现bug操作
4. 点击"导出日志"
5. 将下载的 txt 文件发给开发者

### 场景 2：想分享一个特定页面

直接复制URL，例如：
- 分享市场页面：`http://localhost:3000/market`
- 分享背包页面：`http://localhost:3000/backpack`

### 场景 3：检查是否有JavaScript错误

1. 打开测试面板
2. 点击"运行测试"
3. 查看"错误数"统计
4. 如果大于0，查看日志中的红色ERROR条目

## 问题排查

### Q: 测试面板打不开？
A: 确保开发服务器已启动（npm run dev）

### Q: 点击"打开游戏"没反应？
A: 检查浏览器是否拦截了弹窗，允许弹窗权限

### Q: 日志面板没有显示日志？
A: 
1. 等待2秒让游戏加载
2. 点击"刷新日志"按钮
3. 在游戏窗口点几下看是否有日志

### Q: 路由不工作？
A: 需要先完成 main.js 的手动修改（见 IMPLEMENTATION_GUIDE.md）

### Q: 市场还是要求登录？
A: market.js 已经移除登录限制，确保文件已保存并刷新浏览器

## 下一步

详细说明请查看：
- **FEATURE_SUMMARY.md** - 功能总结报告
- **IMPLEMENTATION_GUIDE.md** - 详细实现指南

---

💡 **提示**：保持测试面板和游戏窗口同时打开，可以实时监控游戏运行情况！
