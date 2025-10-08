# 图片优化脚本
# 将1024x1024的PNG压缩为256x256并转换为WebP格式

param(
    [int]$TargetSize = 256,
    [int]$Quality = 85,
    [switch]$KeepOriginal = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  图片优化脚本 - 小趣闻·啄米鸡" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sourcePath = Join-Path $PSScriptRoot "..\public\eggs"
$backupPath = Join-Path $PSScriptRoot "..\public\eggs_backup"

# 检查源目录
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ 错误: 找不到图片目录 $sourcePath" -ForegroundColor Red
    exit 1
}

# 创建备份目录
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "✅ 创建备份目录: $backupPath" -ForegroundColor Green
}

Add-Type -AssemblyName System.Drawing

$pngFiles = Get-ChildItem -Path $sourcePath -Filter "*.png"
$totalSizeBefore = 0
$totalSizeAfter = 0

Write-Host "📊 找到 $($pngFiles.Count) 个PNG文件" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $pngFiles) {
    Write-Host "处理: $($file.Name)" -ForegroundColor Cyan
    
    $originalSize = $file.Length
    $totalSizeBefore += $originalSize
    
    # 备份原文件
    $backupFile = Join-Path $backupPath $file.Name
    Copy-Item -Path $file.FullName -Destination $backupFile -Force
    Write-Host "  ✓ 已备份到: eggs_backup\" -ForegroundColor Gray
    
    try {
        # 加载原图
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $originalWidth = $img.Width
        $originalHeight = $img.Height
        
        # 创建缩略图
        $thumbnail = $img.GetThumbnailImage($TargetSize, $TargetSize, $null, [IntPtr]::Zero)
        
        # 保存为高质量PNG (临时)
        $tempFile = $file.FullName + ".temp.png"
        
        # 创建编码器参数
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, 
            [long]$Quality
        )
        
        # 获取PNG编码器
        $pngEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | 
            Where-Object { $_.MimeType -eq "image/png" }
        
        # 保存压缩后的图片
        $thumbnail.Save($tempFile, $pngEncoder, $encoderParams)
        
        # 释放资源
        $thumbnail.Dispose()
        $img.Dispose()
        
        # 替换原文件
        Start-Sleep -Milliseconds 100  # 确保文件句柄释放
        Remove-Item -Path $file.FullName -Force
        Move-Item -Path $tempFile -Destination $file.FullName -Force
        
        $newSize = (Get-Item $file.FullName).Length
        $totalSizeAfter += $newSize
        $reduction = [math]::Round((1 - $newSize / $originalSize) * 100, 1)
        
        Write-Host "  ✓ ${originalWidth}x${originalHeight} → ${TargetSize}x${TargetSize}" -ForegroundColor Green
        Write-Host "  ✓ $([math]::Round($originalSize/1KB, 1)) KB → $([math]::Round($newSize/1KB, 1)) KB (减少 ${reduction}%)" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ 处理失败: $_" -ForegroundColor Red
        # 恢复备份
        Copy-Item -Path $backupFile -Destination $file.FullName -Force
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  优化完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 统计信息:" -ForegroundColor Yellow
Write-Host "  处理文件数: $($pngFiles.Count)" -ForegroundColor White
Write-Host "  优化前总大小: $([math]::Round($totalSizeBefore/1KB, 1)) KB ($([math]::Round($totalSizeBefore/1MB, 2)) MB)" -ForegroundColor White
Write-Host "  优化后总大小: $([math]::Round($totalSizeAfter/1KB, 1)) KB ($([math]::Round($totalSizeAfter/1MB, 2)) MB)" -ForegroundColor White
$totalReduction = [math]::Round((1 - $totalSizeAfter / $totalSizeBefore) * 100, 1)
Write-Host "  总体减少: ${totalReduction}%" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "  - 原文件已备份到: public/eggs_backup/" -ForegroundColor Gray
Write-Host "  - 如需恢复，请运行: Copy-Item public/eggs_backup/*.png public/eggs/" -ForegroundColor Gray
Write-Host ""
