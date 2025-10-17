# 更新 Cloudflare Workers CORS 配置指南

## 场景：前端预览地址变更

当 Cloudflare Pages 部署产生新的预览地址时，需要更新 Workers 的 CORS 配置。

---

## 方法 1: 修改 wrangler.toml 文件（推荐）

### 步骤：

1. **编辑 `api/wrangler.toml` 文件**

找到第 15 行的 `CORS_ORIGIN`：

```toml
[vars]
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev"
```

2. **添加新的预览地址**

用逗号分隔添加新地址：

```toml
[vars]
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://NEW_PREVIEW_ID.gggxiaoji.pages.dev"
```

**示例**：
```toml
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://abc123.gggxiaoji.pages.dev"
```

3. **同时更新生产环境配置**

找到第 33 行：

```toml
[env.production.vars]
CORS_ORIGIN = "https://0dca8f01.gggxiaoji.pages.dev,https://gggxiaoji.pages.dev,https://NEW_PREVIEW_ID.gggxiaoji.pages.dev"
```

4. **重新部署 Workers**

```bash
cd api
wrangler deploy
```

5. **验证配置**

```bash
# 测试新地址的 CORS
curl -H "Origin: https://NEW_PREVIEW_ID.gggxiaoji.pages.dev" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://xiaoji-game-api.weixinyongjiu.workers.dev/health
```

---

## 方法 2: 使用通配符（不推荐用于生产）

如果你想允许所有 Cloudflare Pages 的预览地址：

### ⚠️ 警告：安全性较低

```toml
[vars]
# 允许所有来源（仅用于测试）
CORS_ORIGIN = "*"
```

或者，如果想只允许你的 Pages 项目的所有子域名，需要在代码层面修改：

编辑 `api/src/index.ts`：

```typescript
app.use('*', cors({
  origin: (origin) => {
    // 允许所有 gggxiaoji.pages.dev 的子域名
    if (origin && origin.match(/^https:\/\/[a-z0-9]+\.gggxiaoji\.pages\.dev$/)) {
      return origin;
    }
    // 允许主域名
    if (origin === 'https://gggxiaoji.pages.dev') {
      return origin;
    }
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));
```

---

## 方法 3: 使用环境变量（灵活但复杂）

通过 Wrangler CLI 动态设置：

```bash
# 设置为环境变量（不推荐，因为 CORS_ORIGIN 已在 vars 中）
wrangler secret put CORS_ORIGINS_EXTRA
# 输入: https://new-preview.gggxiaoji.pages.dev
```

然后在代码中读取并合并。

---

## 快速更新脚本

创建一个 PowerShell 脚本 `update-cors.ps1`：

```powershell
# 更新 CORS 配置脚本
param(
    [Parameter(Mandatory=$true)]
    [string]$NewUrl
)

Write-Host "🔧 更新 CORS 配置..." -ForegroundColor Cyan

# 读取当前配置
$configFile = "wrangler.toml"
$content = Get-Content $configFile -Raw

# 查找 CORS_ORIGIN 行
if ($content -match 'CORS_ORIGIN = "([^"]+)"') {
    $currentOrigins = $matches[1]
    
    # 检查是否已存在
    if ($currentOrigins -like "*$NewUrl*") {
        Write-Host "✅ URL 已存在于 CORS 配置中" -ForegroundColor Green
        exit 0
    }
    
    # 添加新 URL
    $newOrigins = "$currentOrigins,$NewUrl"
    
    # 替换所有 CORS_ORIGIN
    $content = $content -replace 'CORS_ORIGIN = "[^"]+"', "CORS_ORIGIN = `"$newOrigins`""
    
    # 保存文件
    $content | Set-Content $configFile -NoNewline
    
    Write-Host "✅ CORS 配置已更新" -ForegroundColor Green
    Write-Host "新的 CORS_ORIGIN: $newOrigins" -ForegroundColor Yellow
    
    # 提示部署
    Write-Host "`n⚠️  请运行以下命令部署更新：" -ForegroundColor Yellow
    Write-Host "cd api && wrangler deploy" -ForegroundColor Cyan
} else {
    Write-Host "❌ 找不到 CORS_ORIGIN 配置" -ForegroundColor Red
    exit 1
}
```

**使用方法**：
```powershell
cd api
.\update-cors.ps1 -NewUrl "https://abc123.gggxiaoji.pages.dev"
wrangler deploy
```

---

## 常见问题

### Q: 添加多少个 URL 有限制吗？
A: 理论上没有限制，但建议不超过 10 个以保持配置清晰。

### Q: 预览地址会自动过期吗？
A: Cloudflare Pages 的预览部署会保留，除非手动删除。建议定期清理旧的预览地址。

### Q: 更新后多久生效？
A: 重新部署后立即生效（通常 10-30 秒）。

### Q: 如何查看当前的 CORS 配置？
A: 
```bash
grep CORS_ORIGIN api/wrangler.toml
```

### Q: 如何测试 CORS 是否生效？
A: 在浏览器开发者工具的 Console 中运行：
```javascript
fetch('https://xiaoji-game-api.weixinyongjiu.workers.dev/health', {
  method: 'GET',
  headers: { 'Origin': 'https://NEW_URL.gggxiaoji.pages.dev' }
}).then(r => r.json()).then(console.log);
```

---

## 最佳实践

1. **保留生产地址**: 始终保留 `https://gggxiaoji.pages.dev`
2. **及时清理**: 删除不再使用的预览地址
3. **安全第一**: 避免使用 `*` 通配符
4. **测试验证**: 每次更新后测试 CORS 是否正常工作
5. **版本控制**: 提交 wrangler.toml 的改动

---

## 当前配置

### 生产环境 CORS 白名单：
- https://0dca8f01.gggxiaoji.pages.dev (当前预览)
- https://gggxiaoji.pages.dev (生产)

### 需要添加新地址？
按照上述方法 1 操作即可。

---

**更新时间**: 2025-10-17  
**文档版本**: 1.0
