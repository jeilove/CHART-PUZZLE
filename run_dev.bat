@echo off
echo [Stock Chart Puzzle] Starting Development Environment...

:: Backend start in a new window
start "Backend (FastAPI)" cmd /c "cd backend && uv run uvicorn main:app --reload --port 8000"

:: Frontend start in a new window
start "Frontend (Next.js)" cmd /c "cd frontend && pnpm dev"

:: Wait for a bit and open browser
timeout /t 5
start http://localhost:3000

echo.
echo Development servers are starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
pause
