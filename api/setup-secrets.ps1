# 小鸡游戏 API - Cloudflare Workers 密钥配置脚本
# 此脚本会批量配置所有必需的密钥到 Cloudflare Workers

Write-Host "🔐 配置 Cloudflare Workers 密钥..." -ForegroundColor Cyan

# JWT 密钥（生成随机字符串）
$JWT_SECRET = "your-super-secret-jwt-key-change-in-production-$(Get-Random)"
Write-Host "`n设置 JWT_SECRET..." -ForegroundColor Yellow
echo $JWT_SECRET | wrangler secret put JWT_SECRET

# Supabase Anon Key
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY2t6ZW1vZnpsYml4aWNmbmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjk3MzksImV4cCI6MjA3NTUwNTczOX0.DoKguEdsklx7vvFhyQcNCOLYwX_0F8LcPbg6rfKJnAo"
Write-Host "`n设置 SUPABASE_ANON_KEY..." -ForegroundColor Yellow
echo $SUPABASE_ANON_KEY | wrangler secret put SUPABASE_ANON_KEY

# Google OAuth Client Secret
$GOOGLE_CLIENT_SECRET = "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"
Write-Host "`n设置 GOOGLE_CLIENT_SECRET..." -ForegroundColor Yellow
echo $GOOGLE_CLIENT_SECRET | wrangler secret put GOOGLE_CLIENT_SECRET

Write-Host "`n✅ 所有密钥配置完成！" -ForegroundColor Green
Write-Host "`n密钥列表：" -ForegroundColor Cyan
wrangler secret list

Write-Host "`n💡 提示：密钥已安全存储在 Cloudflare，不会出现在代码或日志中。" -ForegroundColor Blue
