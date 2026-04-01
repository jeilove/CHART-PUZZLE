@echo off
echo Starting Stock Chart Puzzle Project...

:: Starting Backend
start /b cmd /c "cd /d e:\바이브코딩\Stock Chart Puzzle\backend && ..\.venv\Scripts\python main.py"

:: Starting Frontend
start /b cmd /c "cd /d e:\바이브코딩\Stock Chart Puzzle\frontend && pnpm dev --port 3000"

:: Wait for a few seconds then open browser
timeout /t 5
start http://localhost:3000

echo Project is running. Check your browser at http://localhost:3000
pause
