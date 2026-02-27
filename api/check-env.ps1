# 环境变量配置检查脚本

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Environment Variables Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Check wrangler.toml configuration" -ForegroundColor Yellow
$config = Get-Content "wrangler.toml" -Raw
if ($config -match 'GOOGLE_CLIENT_ID = "([^"]+)"') {
    Write-Host "  [OK] GOOGLE_CLIENT_ID in wrangler.toml" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] GOOGLE_CLIENT_ID not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Check deployment output" -ForegroundColor Yellow
Write-Host "Running: wrangler deploy..." -ForegroundColor Gray
$output = wrangler deploy 2>&1 | Out-String
if ($output -match 'env\.GOOGLE_CLIENT_ID') {
    Write-Host "  [OK] GOOGLE_CLIENT_ID appears in deployment" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] GOOGLE_CLIENT_ID not in deployment" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Test OAuth endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google" -MaximumRedirection 0 -ErrorAction Stop
} catch {
    $response = $_.Exception.Response
    if ($response.StatusCode -eq 302) {
        Write-Host "  [OK] OAuth redirects correctly (302)" -ForegroundColor Green
        $location = $response.Headers.Location
        if ($location -match "accounts.google.com") {
            Write-Host "  [OK] Redirects to Google" -ForegroundColor Green
        }
    } elseif ($_.Exception.Message -match "Google OAuth is not configured") {
        Write-Host "  [FAIL] OAuth configuration not working at runtime" -ForegroundColor Red
        Write-Host ""
        Write-Host "PROBLEM IDENTIFIED:" -ForegroundColor Yellow
        Write-Host "  Variables exist in wrangler.toml" -ForegroundColor White
        Write-Host "  BUT they are not accessible at runtime" -ForegroundColor White
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Yellow
        Write-Host "  Add variables via Cloudflare Dashboard:" -ForegroundColor White
        Write-Host "  1. Visit: https://dash.cloudflare.com" -ForegroundColor Cyan
        Write-Host "  2. Workers & Pages -> xiaoji-game-api -> Settings" -ForegroundColor Cyan
        Write-Host "  3. Add Plain Text Variables:" -ForegroundColor Cyan
        Write-Host "     - GOOGLE_CLIENT_ID" -ForegroundColor Gray
        Write-Host "     - GOOGLE_REDIRECT_URI" -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] Unknown error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
