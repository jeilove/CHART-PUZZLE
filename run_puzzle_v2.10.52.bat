@echo off
setlocal
title Stock Chart Puzzle v2.10.52 Starter

echo [v2.10.52] Cleaning up existing sessions...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

echo.
echo [v2.10.52] Starting Backend Server (FastAPI)...
cd backend
start /B uv run uvicorn main:app --host 0.0.0.0 --port 8000
cd ..

echo [v2.10.52] Starting Frontend Server (Next.js)...
cd frontend
start /B pnpm dev --port 3000
cd ..

echo.
echo [v2.10.52] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo [v2.10.52] Launching Dashboard...
start http://localhost:3000

echo.
echo ======================================================
echo   Stock Chart Puzzle v2.10.52 is now running!
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:3000
echo ======================================================
pause
