@echo off
set "BASE_DIR=%~dp0"
echo [1/2] Starting Backend (8000)...
cd /d "%BASE_DIR%backend"
start /b .venv\Scripts\python main.py
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend (3000)...
cd /d "%BASE_DIR%frontend"
start /b pnpm dev --port 3000

echo Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo Launching browser...
start http://localhost:3000
echo.
echo ==========================================
echo Stock Chart Puzzle is now running.
echo Please keep this window open.
echo ==========================================
pause
