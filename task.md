# Task: Stock Chart Puzzle - Trigger Pulse Dashboard (v1.3.0)

## 1. UI & Navigation Expansion
- [x] Add 'TRIGGER' navigation to the bottom tab bar as the 5th icon.
- [x] Use `v3_trigger.png` for the icon and style it consistently with other tabs.
- [x] Integrate `TriggerAnalysis` view state into the main `ProjectApp` view logic.

## 2. Trigger Analysis Dashboard Components
- [x] Develop `TriggerAnalysis.tsx` component with 4 main sections:
  1. **Positive Trigger Cloud**: Stock cloud visualizing stocks with positive sentiment.
  2. **Negative Trigger Cloud**: Stock cloud visualizing stocks with negative sentiment.
  3. **Change Trigger Cloud**: Cards showing stocks with significant change keywords (e.g., 'Surge', 'Inventory Down').
  4. **Timeline View**: Trend chart showing sentiment index evolution by stock.

## 3. Backend Analysis Engine Update
- [x] Implement `/api/trigger/summary` endpoint in `main.py`.
- [x] Add new `change` keywords to `TRIGGER_KEYWORDS` in `scraper.py`.
- [x] Develop `fetch_trigger_summary` in `scraper.py` to:
  - Fetch top-market stocks (KOSPI 15, KOSDAQ 10).
  - Analyze each stock using existing `analysis_trigger_cloud`.
  - Categorize and sort stocks based on sentiment scores and change keyword intensity.
  - Generate simulated timeline data for the trend chart.

## 4. Stability & Deployment
- [x] Refine `run_dev.bat` to automatically kill existing Node/Python processes on startup to prevent port conflicts.
- [x] Update version information to `v1.3.0` across the application.
- [x] Verify all core functionalities (Puzzle, Chart, Searching) remain intact.
