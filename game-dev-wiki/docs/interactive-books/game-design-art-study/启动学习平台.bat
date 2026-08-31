@echo off
cd /d "%~dp0"
echo ===================================================
echo   启动《游戏设计艺术》互动学习平台
echo ===================================================
echo.
echo 正在启动本地微型服务器...
start "Game Design Art Server" cmd /k "python -m http.server 8080"

echo 等待服务器启动...
timeout /t 2 >nul

echo 正在浏览器中打开平台...
start http://localhost:8080/index.html
echo [注意] 学习结束后，您可以直接关闭本黑框窗口。
pause
