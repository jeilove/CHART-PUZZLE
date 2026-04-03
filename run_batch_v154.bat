@echo off
echo [v1.5.4] Stock Chart Puzzle Batch Analysis - RESTARTING PROCESS
echo Cleaning up existing processes...

:: Kill existing python processes to avoid conflicts
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo Starting Batch Analysis Engine (350 Stocks)...
cd /d "e:\바이브코딩\Stock Chart Puzzle"

:: 가상환경 활성화 (있는 경우)
if exist .venv\Scripts\activate (
    call .venv\Scripts\activate
)

:: 분석 실행
python backend/batch_analyze.py

echo.
echo Analysis Finished. Results saved to backend/trigger_report.json
echo Monitoring version info in console...
pause
