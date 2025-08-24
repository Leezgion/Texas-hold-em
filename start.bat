@echo off
echo 启动德州扑克游戏...
echo.

echo 正在安装服务器端依赖...
cd server
call npm install
if %errorlevel% neq 0 (
    echo 服务器端依赖安装失败！
    pause
    exit /b 1
)

echo 正在安装客户端依赖...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo 客户端依赖安装失败！
    pause
    exit /b 1
)

echo.
echo 依赖安装完成！
echo.
echo 请按照以下步骤启动项目：
echo 1. 打开新的命令提示符窗口
echo 2. 运行: cd server && npm start
echo 3. 再打开另一个命令提示符窗口
echo 4. 运行: cd client && npm run dev
echo.
echo 服务器将在 http://localhost:3001 运行
echo 客户端将在 http://localhost:5173 运行
echo.
pause 