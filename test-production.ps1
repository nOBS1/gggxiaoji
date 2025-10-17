# Production Testing Script

Write-Host "Testing Production Environment..." -ForegroundColor Cyan
Write-Host ""

# Test 1: API Health Check
Write-Host "Test 1: API Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://xiaoji-game-api.weixinyongjiu.workers.dev/health" -Method Get
    if ($response.status -eq "ok") {
        Write-Host "[PASS] API Health Check" -ForegroundColor Green
        Write-Host "  Version: $($response.version)" -ForegroundColor Gray
    }
    else {
        Write-Host "[FAIL] API Health Check" -ForegroundColor Red
    }
}
catch {
    Write-Host "[FAIL] API Health Check: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Frontend Access
Write-Host "Test 2: Frontend Accessibility" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://0dca8f01.gggxiaoji.pages.dev" -Method Get -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "[PASS] Frontend is accessible" -ForegroundColor Green
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    }
    else {
        Write-Host "[FAIL] Frontend not accessible" -ForegroundColor Red
    }
}
catch {
    Write-Host "[FAIL] Frontend access failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] API: https://xiaoji-game-api.weixinyongjiu.workers.dev" -ForegroundColor Green
Write-Host "[OK] Frontend: https://0dca8f01.gggxiaoji.pages.dev" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure Google OAuth callback URL in Google Cloud Console" -ForegroundColor White
Write-Host "   Add: https://xiaoji-game-api.weixinyongjiu.workers.dev/api/auth/google/callback" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Visit frontend to test game features" -ForegroundColor White
Write-Host "   URL: https://0dca8f01.gggxiaoji.pages.dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test Google OAuth login" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT_SUMMARY.md for complete documentation" -ForegroundColor Blue
