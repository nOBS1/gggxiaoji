# Google OAuth 问题诊断和修复脚本

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔍 Google OAuth 问题诊断" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 wrangler.toml 配置
Write-Host "1️⃣ 检查 wrangler.toml 配置..." -ForegroundColor Yellow
$config = Get-Content "wrangler.toml" -Raw

if ($config -match 'GOOGLE_CLIENT_ID = "([^"]+)"') {
    Write-Host "  ✅ GOOGLE_CLIENT_ID: $($matches[1])" -ForegroundColor Green
} else {
    Write-Host "  ❌ GOOGLE_CLIENT_ID 未配置" -ForegroundColor Red
}

if ($config -match 'GOOGLE_REDIRECT_URI = "([^"]+)"') {
    Write-Host "  ✅ GOOGLE_REDIRECT_URI: $($matches[1])" -ForegroundColor Green
} else {
    Write-Host "  ❌ GOOGLE_REDIRECT_URI 未配置" -ForegroundColor Red
}

Write-Host ""

# 2. 检查 Secrets
Write-Host "2️⃣ 检查 Cloudflare Workers Secrets..." -ForegroundColor Yellow
$secrets = wrangler secret list | ConvertFrom-Json
$secretNames = $secrets | ForEach-Object { $_.name }

if ($secretNames -contains "GOOGLE_CLIENT_SECRET") {
    Write-Host "  ✅ GOOGLE_CLIENT_SECRET 已配置" -ForegroundColor Green
} else {
    Write-Host "  ❌ GOOGLE_CLIENT_SECRET 未配置" -ForegroundColor Red
}

if ($secretNames -contains "JWT_SECRET") {
    Write-Host "  ✅ JWT_SECRET 已配置" -ForegroundColor Green
} else {
    Write-Host "  ❌ JWT_SECRET 未配置" -ForegroundColor Red
}

if ($secretNames -contains "SUPABASE_ANON_KEY") {
    Write-Host "  ✅ SUPABASE_ANON_KEY 已配置" -ForegroundColor Green
} else {
    Write-Host "  ❌ SUPABASE_ANON_KEY 未配置" -ForegroundColor Red
}

Write-Host ""

# 3. 测试 API 端点
Write-Host "3️⃣ 测试 OAuth 端点..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 302 -or $response.StatusCode -eq 301) {
        Write-Host "  ✅ OAuth 端点正常 (重定向)" -ForegroundColor Green
        $location = $response.Headers.Location
        if ($location -match "accounts.google.com") {
            Write-Host "  ✅ 正确重定向到 Google" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ OAuth 端点异常: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 302) {
        Write-Host "  ✅ OAuth 端点正常 (重定向)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ OAuth 端点错误: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔧 问题分析与修复建议" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "问题原因:" -ForegroundColor Yellow
Write-Host "Cloudflare Workers 环境变量未正确传递到运行时上下文" -ForegroundColor White
Write-Host ""

Write-Host "解决方案:" -ForegroundColor Yellow
Write-Host "1. 重新部署 Workers 以刷新环境变量" -ForegroundColor White
Write-Host "2. 确保 wrangler.toml 配置正确" -ForegroundColor White
Write-Host ""

Write-Host "⚠️ 立即修复?" -ForegroundColor Yellow
$fix = Read-Host "是否立即重新部署 Workers? (y/N)"

if ($fix -eq 'y' -or $fix -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 重新部署 Workers..." -ForegroundColor Cyan
    wrangler deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "请等待 10-30 秒让配置生效，然后测试：" -ForegroundColor Yellow
        Write-Host "https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 部署失败，请检查错误信息" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "💡 手动部署命令：" -ForegroundColor Blue
    Write-Host "wrangler deploy" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ 诊断完成" -ForegroundColor Green
