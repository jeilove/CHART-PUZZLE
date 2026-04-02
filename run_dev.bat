@echo off
echo [Stock Chart Puzzle] Starting Development Environment...

:: Backend start
start "Backend (FastAPI)" cmd /c "cd backend && .venv\Scripts\python main.py"

:: Frontend start
start "Frontend (Next.js)" cmd /c "cd frontend && pnpm dev --port 3000"

:: Wait for a bit and open browser
timeout /t 10
start http://localhost:3000

echo.
echo Development servers are starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
pause
