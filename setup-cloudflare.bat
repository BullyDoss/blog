@echo off
echo ============================================
echo   Cloudflare 博客配置工具
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] 检查 Wrangler...
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未找到 npx，请确保已安装 Node.js
    pause
    exit /b 1
)
echo ✅ npx 已就绪
echo.

echo [2/6] 登录 Cloudflare...
echo 📌 即将打开浏览器进行授权...
echo.
npx wrangler login
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 登录失败
    pause
    exit /b 1
)
echo ✅ 登录成功
echo.

echo [3/6] 创建 D1 数据库...
npx wrangler d1 create blog-db
echo ✅ D1 数据库创建完成
echo.

echo [4/6] 创建 R2 存储桶...
npx wrangler r2 bucket create blog-images
echo ✅ R2 存储桶创建完成
echo.

echo [5/6] 初始化数据库表结构...
echo ⚠️  请先编辑 worker\wrangler.toml，填入你的 D1 database_id
echo.
set /p CONTINUE="是否继续？(Y/N): "
if /i not "%CONTINUE%"=="Y" goto skip_db

npx wrangler d1 execute blog-db --local --file=worker\schema.sql
echo ✅ 数据库初始化完成

:skip_db
echo.

echo [6/6] 安装 Worker 依赖...
cd worker
call npm install
cd ..
echo ✅ Worker 依赖安装完成
echo.

echo ============================================
echo   🎉 所有 Cloudflare 服务配置完成！
echo ============================================
echo.
echo 下一步：
echo   1. 编辑 worker\wrangler.toml，填入实际值
echo   2. 运行：cd worker && npx wrangler dev (测试本地)
echo   3. 运行：cd worker && npx wrangler deploy (部署生产)
echo.
pause
