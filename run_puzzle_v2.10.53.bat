@echo off
echo [Stock Chart Puzzle v2.10.53] Cleaning up zombie processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo Starting Backend (FastAPI)...
start /b cmd /c "cd backend && ..\.venv\Scripts\python -m uvicorn main:app --reload --port 8000"

echo Starting Frontend (Next.js)...
cd frontend
pnpm dev --port 3000

echo Launching browser...
start http://localhost:3000
