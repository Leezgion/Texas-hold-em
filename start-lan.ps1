# 德州扑克游戏 - 局域网启动脚本

Write-Host "🎮 启动德州扑克游戏 - 局域网模式" -ForegroundColor Green
Write-Host ""

# 获取本机局域网IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or ($_.IPAddress -like "172.*" -and [int]($_.IPAddress.Split('.')[1]) -ge 16 -and [int]($_.IPAddress.Split('.')[1]) -le 31)})[0].IPAddress

if (-not $localIP) {
    $localIP = "localhost"
    Write-Host "⚠️  未检测到局域网IP，使用localhost" -ForegroundColor Yellow
} else {
    Write-Host "🌐 检测到局域网IP: $localIP" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "正在启动服务器和客户端..." -ForegroundColor Yellow
Write-Host ""

# 启动服务器
Write-Host "🚀 启动服务器端..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# 等待2秒
Start-Sleep -Seconds 2

# 启动客户端
Write-Host "🚀 启动客户端..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

# 等待5秒让服务启动
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ 服务启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📱 访问地址：" -ForegroundColor Cyan
Write-Host "   本机访问:     http://localhost:5173" -ForegroundColor White
if ($localIP -ne "localhost") {
    Write-Host "   局域网访问:   http://$localIP:5173" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📲 其他设备访问步骤：" -ForegroundColor Cyan
    Write-Host "   1. 确保设备连接到同一WiFi网络" -ForegroundColor White
    Write-Host "   2. 在浏览器中访问: http://$localIP:5173" -ForegroundColor White
    Write-Host "   3. 创建房间或加入游戏" -ForegroundColor White
}
Write-Host ""
Write-Host "🎯 提示：" -ForegroundColor Cyan
Write-Host "   - 服务器运行在端口 3001" -ForegroundColor White  
Write-Host "   - 客户端运行在端口 5173" -ForegroundColor White
Write-Host "   - 修改代码会自动重启服务器" -ForegroundColor White
Write-Host ""
Read-Host "按回车键退出"