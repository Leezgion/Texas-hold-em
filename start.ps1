Write-Host "启动德州扑克游戏..." -ForegroundColor Green
Write-Host ""

Write-Host "正在安装服务器端依赖..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "服务器端依赖安装失败！" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "正在安装客户端依赖..." -ForegroundColor Yellow
Set-Location ..\client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "客户端依赖安装失败！" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Write-Host "依赖安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "请按照以下步骤启动项目：" -ForegroundColor Cyan
Write-Host "1. 打开新的PowerShell窗口" -ForegroundColor White
Write-Host "2. 运行: cd server; npm start" -ForegroundColor White
Write-Host "3. 再打开另一个PowerShell窗口" -ForegroundColor White
Write-Host "4. 运行: cd client; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "服务器将在 http://localhost:3001 运行" -ForegroundColor Yellow
Write-Host "客户端将在 http://localhost:5173 运行" -ForegroundColor Yellow
Write-Host ""
Read-Host "按回车键退出" 