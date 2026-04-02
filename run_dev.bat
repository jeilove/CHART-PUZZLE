@echo off
echo [Stock Chart Puzzle] Cleaning up existing processes...

:: Kill existing node and python processes
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

:: Clear port 3000 and 8000 (standard Windows way)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak >nul

echo [Stock Chart Puzzle] Starting Development Environment...

:: Backend start
cd backend
start "Backend (FastAPI)" cmd /c ".venv\Scripts\python main.py"
cd ..

:: Frontend start
cd frontend
start "Frontend (Next.js)" cmd /c "pnpm dev --port 3000"
cd ..

:: Wait for a bit and open browser
echo Waiting for servers to initialize...
timeout /t 10
start http://localhost:3000

echo.
echo Development servers are starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
pause
