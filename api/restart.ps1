# 快速重启后端服务器脚本

Write-Host "🔄 正在重启后端服务器..." -ForegroundColor Cyan

# 杀掉占用 8787 端口的进程
$connections = netstat -ano | Select-String ":8787" | Select-String "LISTENING"
if ($connections) {
    $connections | ForEach-Object {
        $line = $_.Line
        $parts = $line -split '\s+'
        $pid = $parts[-1]
        Write-Host "⚠️  终止进程 PID: $pid" -ForegroundColor Yellow
        taskkill /PID $pid /F | Out-Null
    }
    Start-Sleep -Seconds 1
}

Write-Host "✅ 端口已清理" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 启动服务器..." -ForegroundColor Cyan
Write-Host ""

# 启动服务器
npm run dev
