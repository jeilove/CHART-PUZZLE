from scraper import fetch_stock_ohlcv
import json

data = fetch_stock_ohlcv("005930")
if data:
    print(f"SUCCESS: {len(data)} items found")
else:
    print("FAILED: No data found")
