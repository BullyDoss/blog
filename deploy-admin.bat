@echo off
echo ============================================
echo   部署博客管理后台
echo ============================================

cd /d "%~dp0.."

echo [1/2] 部署到 Cloudflare Pages...
npx wrangler pages deploy admin --project-name=blog-admin

echo.
echo ============================================
echo   🎉 管理后台部署完成！
echo.
echo   访问地址: https://blog-admin.pages.dev
echo   (或显示的实际地址)
echo.
echo   默认账号: admin / admin123
echo ============================================
pause
