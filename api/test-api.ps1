# ==================== API 测试脚本 ====================
# PowerShell 脚本，用于测试后端 API

$baseUrl = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "小鸡点击游戏 API 测试脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 测试健康检查
Write-Host "1️⃣ 测试健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ 健康检查成功！" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "❌ 健康检查失败：$($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. 测试用户注册
Write-Host "2️⃣ 测试用户注册..." -ForegroundColor Yellow
$registerBody = @{
    email = "test$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✅ 注册成功！" -ForegroundColor Green
    Write-Host "Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "User ID: $($response.data.user.id)" -ForegroundColor Gray
    Write-Host "Email: $($response.data.user.email)" -ForegroundColor Gray
    
    # 保存 token 用于后续测试
    $global:token = $response.data.token
    $global:userId = $response.data.user.id
    $global:email = $response.data.user.email
} catch {
    Write-Host "❌ 注册失败：$($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit
}
Write-Host ""

# 3. 测试用户登录
Write-Host "3️⃣ 测试用户登录..." -ForegroundColor Yellow
$loginBody = @{
    email = $global:email
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✅ 登录成功！" -ForegroundColor Green
    Write-Host "Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ 登录失败：$($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. 测试获取游戏状态
Write-Host "4️⃣ 测试获取游戏状态..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $global:token"
        "Accept-Language" = "zh"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/game/state" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ 获取游戏状态成功！" -ForegroundColor Green
    Write-Host "金币: $($response.data.profile.coins)" -ForegroundColor Gray
    Write-Host "昵称: $($response.data.profile.nickname)" -ForegroundColor Gray
    Write-Host "库存数量: $($response.data.inventory.Count)" -ForegroundColor Gray
    Write-Host "升级数量: $($response.data.upgrades.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 获取游戏状态失败：$($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. 测试获取用户资料
Write-Host "5️⃣ 测试获取用户资料..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $global:token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/profile" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ 获取用户资料成功！" -ForegroundColor Green
    Write-Host ($response.data | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "❌ 获取用户资料失败：$($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. 测试排行榜
Write-Host "6️⃣ 测试排行榜..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/profile/leaderboard?limit=5" `
        -Method Get
    
    Write-Host "✅ 获取排行榜成功！" -ForegroundColor Green
    Write-Host "排行榜用户数: $($response.data.leaderboard.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 获取排行榜失败：$($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
