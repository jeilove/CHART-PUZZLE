import sys
import os
sys.path.append(r'e:\바이브코딩\Stock Chart Puzzle')
from backend.scraper import fetch_reports_combined

symbol = "066970" # L&F
name = "엘앤에프"
text, dates = fetch_reports_combined(symbol, name)
print(f"Total Unique Dates found for {name}: {len(set(dates))}")
print(f"Dates: {sorted(list(set(dates)), reverse=True)}")
