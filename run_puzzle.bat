@echo off
setlocal
set "BASE_DIR=%~dp0"
echo Starting Stock Chart Puzzle Project from %BASE_DIR%...

:: Starting Backend
echo Launching Backend...
start /b cmd /c "cd /d "%BASE_DIR%backend" && ..\.venv\Scripts\python main.py"

:: Starting Frontend
echo Launching Frontend...
start /b cmd /c "cd /d "%BASE_DIR%frontend" && pnpm dev --port 3000"

:: Wait for a few seconds then open browser
timeout /t 8
start http://localhost:3000

echo Project is running. Check your browser at http://localhost:3000
pause
endlocal
