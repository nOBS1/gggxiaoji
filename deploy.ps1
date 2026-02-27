# 🚀 鸡蛋模拟器 - Cloudflare 部署脚本
# Windows PowerShell 版本

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🐔 鸡蛋模拟器 - 部署到 Cloudflare" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 步骤 1: 部署后端 API
Write-Host "📦 步骤 1/3: 部署后端 API 到 Cloudflare Workers..." -ForegroundColor Yellow
Write-Host ""

cd api

Write-Host "  检查 wrangler 是否已登录..." -ForegroundColor Gray
$wranglerAuth = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  需要登录 Cloudflare..." -ForegroundColor Yellow
    Write-Host "  正在打开浏览器进行登录..." -ForegroundColor Gray
    npx wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 登录失败，请重试" -ForegroundColor Red
        cd ..
        exit 1
    }
}

Write-Host "  ✅ Cloudflare 认证成功" -ForegroundColor Green
Write-Host ""

Write-Host "  正在部署 API..." -ForegroundColor Gray
npm run deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API 部署失败" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "  ✅ API 部署成功！" -ForegroundColor Green
cd ..

# 步骤 2: 构建前端
Write-Host "`n🎨 步骤 2/3: 构建前端..." -ForegroundColor Yellow
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ 前端构建成功！" -ForegroundColor Green

# 步骤 3: 部署前端
Write-Host "`n📤 步骤 3/3: 部署前端到 Cloudflare Pages..." -ForegroundColor Yellow
Write-Host ""

# 询问项目名称（如果是首次部署）
$projectName = Read-Host "  请输入项目名称 (默认: xiaoji-game)"
if ([string]::IsNullOrWhiteSpace($projectName)) {
    $projectName = "xiaoji-game"
}

Write-Host "  正在部署前端..." -ForegroundColor Gray
npx wrangler pages deploy dist --project-name $projectName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端部署失败" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ 前端部署成功！" -ForegroundColor Green

# 完成
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "🎮 你的游戏已上线！" -ForegroundColor Green
Write-Host ""
Write-Host "前端地址: " -NoNewline
Write-Host "https://$projectName.pages.dev" -ForegroundColor Blue
Write-Host ""
Write-Host "后端 API: 请查看上面的 Workers URL" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  重要提示:" -ForegroundColor Yellow
Write-Host "1. 请记下上面的 Workers API URL" -ForegroundColor White
Write-Host "2. 在 src/js/config.js 中更新 API_BASE_URL" -ForegroundColor White
Write-Host "3. 重新构建和部署前端 (npm run build && npx wrangler pages deploy dist --project-name $projectName)" -ForegroundColor White
Write-Host ""
Write-Host "📚 详细文档: CLOUDFLARE_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
