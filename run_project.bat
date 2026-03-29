@echo off
echo Starting Stocks...
start /b cmd /c "cd backend && .venv\Scripts\python main.py"
start /b cmd /c "cd frontend && pnpm dev"
echo Servers started. Waiting for initialization...
timeout /t 10
start http://localhost:3000
echo.
echo Setup Complete!
