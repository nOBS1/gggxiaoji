# v4.0 文案更新说明

## 📝 更新内容

### 欢迎横幅文案

#### 修改文件
`src/js/i18n.js`

#### 中文版本

```javascript
// 修改前 (v3.x)
announcementMain: '欢迎来到小游戏·小鸡生蛋！点击小鸡开始你的养鸡之旅！'

// 修改后 (v4.0)
announcementMain: '🎮 小鸡生蛋 v4.0 - 数字合成版！像2048一样轻松摸鱼，合成即产蛋～'
```

**变化要点**：
- ✅ 强调版本号 "v4.0"
- ✅ 突出核心玩法 "数字合成版"
- ✅ 使用场景描述 "像2048一样轻松摸鱼"
- ✅ 核心机制 "合成即产蛋"
- ✅ 添加游戏手柄emoji 🎮

#### 英文版本

```javascript
// 修改前 (v3.x)
announcementMain: 'Welcome to Chicken Egg Laying Game! Click the chicken to start your journey!'

// 修改后 (v4.0)
announcementMain: '🎮 Chicken Egg Laying v4.0 - Merge Edition! Like 2048, merge numbers to lay eggs~'
```

**变化要点**：
- ✅ Version highlight "v4.0"
- ✅ Core gameplay "Merge Edition"
- ✅ Familiar reference "Like 2048"
- ✅ Simplified message "merge numbers to lay eggs"

---

## 🎯 文案设计原则

### 1. 突出版本变化
- 明确标注 "v4.0"
- 说明这是"数字合成版"/"Merge Edition"

### 2. 降低学习成本
- 使用玩家熟悉的参照物 "2048"
- 让用户立即理解玩法

### 3. 强调使用场景
- "摸鱼" - 贴合目标用户场景
- "轻松" - 强调休闲属性

### 4. 核心机制一句话
- "合成即产蛋" - 简洁明了
- "merge numbers to lay eggs" - 直白易懂

---

## 📱 显示效果

### PC端
```
┌─────────────────────────────────────────────────┐
│ 🎉 🎮 小鸡生蛋 v4.0 - 数字合成版！            × │
│    像2048一样轻松摸鱼，合成即产蛋～              │
└─────────────────────────────────────────────────┘
```

### 移动端
```
┌───────────────────────────────┐
│ 🎉 🎮 小鸡生蛋 v4.0          × │
│    数字合成版！像2048          │
│    一样轻松摸鱼～              │
└───────────────────────────────┘
```

---

## ✅ 验收标准

- [ ] 中文文案显示正确
- [ ] 英文文案显示正确
- [ ] 语言切换正常
- [ ] 横幅可正常关闭
- [ ] 文案长度适中（不换行）

---

## 🔄 其他需要更新的文案

### 游戏指南（已在index.html更新）

**中文**：
- 数字合成玩法
- 自动产蛋规则
- 升级系统说明

**英文**：需要补充对应翻译

### 标题栏（可选）

```html
<!-- 当前 -->
<title>小鸡生蛋游戏 - 免费在线HTML5小游戏 | Chicken Egg Laying Game - Free Online HTML5 Game</title>

<!-- 建议更新为 -->
<title>小鸡生蛋 v4.0 - 数字合成版 | Chicken Egg Laying v4.0 - Merge Edition</title>
```

### Meta描述（可选）

```html
<!-- 当前 -->
<meta name="description" content="小鸡生蛋游戏 - 免费在线HTML5小游戏，点击小鸡收集稀有鸡蛋...">

<!-- 建议更新为 -->
<meta name="description" content="小鸡生蛋 v4.0 数字合成版 - 像2048一样的摸鱼神器，合成数字自动产蛋...">
```

---

## 📊 A/B测试建议

### 方案A（当前）
> 🎮 小鸡生蛋 v4.0 - 数字合成版！像2048一样轻松摸鱼，合成即产蛋～

**优点**：
- 信息全面
- 使用场景明确
- 有趣味性

**缺点**：
- 稍长，移动端可能换行

### 方案B（简化版）
> 🎮 v4.0 数字合成！像2048一样，合成产蛋～

**优点**：
- 更简洁
- 移动端友好

**缺点**：
- 缺少"摸鱼"场景描述

### 方案C（强调新手友好）
> 🎮 v4.0新玩法！2048+养成，零门槛摸鱼～

**优点**：
- 强调"零门槛"
- "2048+养成"更直观

**缺点**：
- 没有提到"合成产蛋"核心机制

---

## 🎨 视觉建议

### 横幅样式优化

```css
.announcement-banner {
  /* 当前样式保持 */
  
  /* 建议添加渐变背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* 或使用游戏主题色 */
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
}
```

### 添加版本徽章（可选）

```html
<div class="announcement-content">
  <span class="announcement-icon">🎉</span>
  <span class="version-badge">NEW</span>
  <span class="announcement-text">...</span>
</div>
```

---

## 📝 待办事项

- [x] 更新中文公告文案
- [x] 更新英文公告文案
- [x] 更新游戏指南（index.html）
- [ ] 测试文案显示效果
- [ ] 确认移动端不换行
- [ ] 多语言切换测试
- [ ] 考虑是否更新SEO元数据

---

## 🚀 部署注意事项

### 缓存清理
更新后需要清理：
- 浏览器缓存
- CDN缓存（如有）
- Service Worker缓存（如有）

### 用户提示
考虑添加"新版本上线"的额外提示：
```javascript
if (localStorage.getItem('lastVersion') !== '4.0.0') {
  // 显示版本更新弹窗
  showVersionUpdateModal();
  localStorage.setItem('lastVersion', '4.0.0');
}
```

---

**更新日期**: 2025-11-09  
**更新版本**: v4.0.0  
**更新人员**: AI Assistant  
**测试状态**: ⏳ 等待验证
