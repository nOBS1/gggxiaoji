# CORS 配置快速更新脚本
# 用法: .\update-cors.ps1 -NewUrl "https://new-preview.gggxiaoji.pages.dev"

param(
    [Parameter(Mandatory=$true, HelpMessage="新的前端 URL")]
    [string]$NewUrl
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔧 Cloudflare Workers CORS 配置更新工具" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 验证 URL 格式
if ($NewUrl -notmatch '^https?://') {
    Write-Host "❌ 错误: URL 必须以 http:// 或 https:// 开头" -ForegroundColor Red
    exit 1
}

# 读取配置文件
$configFile = "wrangler.toml"

if (-not (Test-Path $configFile)) {
    Write-Host "❌ 错误: 找不到 wrangler.toml 文件" -ForegroundColor Red
    Write-Host "请确保在 api 目录下运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "📖 读取当前配置..." -ForegroundColor Yellow
$content = Get-Content $configFile -Raw

# 查找所有 CORS_ORIGIN 配置
$matches = [regex]::Matches($content, 'CORS_ORIGIN = "([^"]+)"')

if ($matches.Count -eq 0) {
    Write-Host "❌ 错误: 找不到 CORS_ORIGIN 配置" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 找到 $($matches.Count) 处 CORS_ORIGIN 配置" -ForegroundColor Green
Write-Host ""

# 检查 URL 是否已存在
$urlExists = $false
foreach ($match in $matches) {
    $currentOrigins = $match.Groups[1].Value
    if ($currentOrigins -like "*$NewUrl*") {
        $urlExists = $true
        break
    }
}

if ($urlExists) {
    Write-Host "✅ URL 已存在于 CORS 配置中，无需更新" -ForegroundColor Green
    Write-Host "当前配置: $currentOrigins" -ForegroundColor Gray
    exit 0
}

# 更新所有 CORS_ORIGIN 配置
Write-Host "🔄 更新 CORS 配置..." -ForegroundColor Yellow

$updatedCount = 0
$newContent = $content

foreach ($match in $matches) {
    $oldValue = $match.Value
    $currentOrigins = $match.Groups[1].Value
    $newOrigins = "$currentOrigins,$NewUrl"
    $newValue = "CORS_ORIGIN = `"$newOrigins`""
    
    $newContent = $newContent.Replace($oldValue, $newValue)
    $updatedCount++
    
    Write-Host "  [$updatedCount] 已更新" -ForegroundColor Green
}

# 保存文件
try {
    $newContent | Set-Content $configFile -NoNewline -Encoding UTF8
    Write-Host ""
    Write-Host "✅ 配置文件已成功更新！" -ForegroundColor Green
} catch {
    Write-Host "❌ 保存文件失败: $_" -ForegroundColor Red
    exit 1
}

# 显示更新摘要
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 更新摘要" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "新增 URL: $NewUrl" -ForegroundColor Green
Write-Host "更新次数: $updatedCount 处" -ForegroundColor Gray
Write-Host ""

# 提示下一步操作
Write-Host "⚠️  下一步操作：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 检查配置是否正确:" -ForegroundColor White
Write-Host "   cat wrangler.toml | Select-String CORS_ORIGIN" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 部署到 Cloudflare Workers:" -ForegroundColor White
Write-Host "   wrangler deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 验证 CORS 是否生效 (部署后):" -ForegroundColor White
Write-Host "   在浏览器控制台运行:" -ForegroundColor Gray
Write-Host "   fetch('https://xiaoji-game-api.weixinyongjiu.workers.dev/health')" -ForegroundColor Gray
Write-Host ""

# 询问是否立即部署
$deploy = Read-Host "是否立即部署到 Cloudflare Workers? (y/N)"
if ($deploy -eq 'y' -or $deploy -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 开始部署..." -ForegroundColor Cyan
    wrangler deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 部署成功！CORS 配置已生效" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 部署失败，请检查错误信息" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  记得稍后运行 'wrangler deploy' 使配置生效" -ForegroundColor Blue
}

Write-Host ""
Write-Host "✨ 完成！" -ForegroundColor Green
