@echo off
title Aone Toolkit Runner

echo ============================================================
echo               Aone Toolkit Project Runner
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%aone-toolkit\package.json" (
    cd /d "%SCRIPT_DIR%aone-toolkit"
) else if exist "%SCRIPT_DIR%package.json" (
    cd /d "%SCRIPT_DIR%"
) else (
    echo [ERROR] package.json not found!
    pause
    exit /b 1
)

echo [Working Directory] %CD%
echo.

echo [1/4] Checking Node.js environment...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js Version: %NODE_VERSION%
echo.

echo [2/4] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies, please wait...
    call npm install
) else (
    echo [OK] node_modules ready.
)
echo.

echo [3/4] Syncing SvelteKit and Type Checking...
call npm run prepare
call npm run check
echo.

echo ============================================================
echo [4/4] Starting Vite Dev Server...
echo Access URL: http://localhost:5173
echo Press Ctrl + C to stop server
echo ============================================================
echo.

call npm run dev
