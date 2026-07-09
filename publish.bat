@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ======================================
echo    自动发布脚本
echo ======================================
echo.

REM 检查工作目录是否干净
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if not "!STATUS!"=="" (
    echo [错误] Git 工作目录不干净，请先提交或撤销更改
    git status
    pause
    exit /b 1
)

REM 选择版本类型
echo 请选择版本更新类型:
echo 1. patch   (1.0.4 -^> 1.0.5) 小修复
echo 2. minor   (1.0.4 -^> 1.1.0) 新功能
echo 3. major   (1.0.4 -^> 2.0.0) 重大更新
echo.
set /p VERSION_TYPE="输入选项 [1/2/3]: "

if "%VERSION_TYPE%"=="1" set VERSION_CMD=patch
if "%VERSION_TYPE%"=="2" set VERSION_CMD=minor
if "%VERSION_TYPE%"=="3" set VERSION_CMD=major

if not defined VERSION_CMD (
    echo [错误] 无效的选项
    pause
    exit /b 1
)

echo.
echo ======================================
echo 开始发布流程...
echo ======================================
echo.

REM 1. 构建项目
echo [1/5] 构建项目...
call npm run build
if errorlevel 1 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [✓] 构建完成
echo.

REM 2. 更新版本号
echo [2/5] 更新版本号 (%VERSION_CMD%)...
call npm version %VERSION_CMD%
if errorlevel 1 (
    echo [错误] 版本更新失败
    pause
    exit /b 1
)
echo [✓] 版本更新完成
echo.

REM 3. 推送到 GitHub
echo [3/5] 推送到 GitHub...
git push
if errorlevel 1 (
    echo [错误] 推送代码失败
    pause
    exit /b 1
)
git push --tags
if errorlevel 1 (
    echo [错误] 推送标签失败
    pause
    exit /b 1
)
echo [✓] 推送完成
echo.

REM 4. 发布到 npm
echo [4/5] 发布到 npm...
call npm publish
if errorlevel 1 (
    echo [错误] npm 发布失败
    pause
    exit /b 1
)
echo [✓] npm 发布完成
echo.

REM 5. 显示最终结果
echo [5/5] 获取发布信息...
for /f "tokens=2 delims=:" %%a in ('npm pkg get version') do set NEW_VERSION=%%a
set NEW_VERSION=%NEW_VERSION:"=%
set NEW_VERSION=%NEW_VERSION: =%

echo.
echo ======================================
echo    发布成功! 🎉
echo ======================================
echo 版本: %NEW_VERSION%
echo npm: https://www.npmjs.com/package/zx-infinite-scroll
echo GitHub: https://github.com/changhaotian6/zx-infinite-scroll
echo ======================================
echo.

pause
