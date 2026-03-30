import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from scraper import analysis_trigger_cloud

STOCK_LIST = [
    { "name": "삼성전자", "symbol": "005930" },
    { "name": "SK하이닉스", "symbol": "000660" },
    { "name": "LG에너지솔루션", "symbol": "373220" },
    { "name": "삼성바이오로직스", "symbol": "207940" },
    { "name": "현대차", "symbol": "005380" },
    { "name": "기아", "symbol": "000270" },
    { "name": "셀트리온", "symbol": "068270" },
    { "name": "POSCO홀딩스", "symbol": "005490" },
    { "name": "엘앤에프", "symbol": "066970" },
    { "name": "카카오", "symbol": "035720" },
]

print("Starting pre-cache for major stocks... (This may take a while)")
for stock in STOCK_LIST:
    print(f"Caching {stock['name']} ({stock['symbol']})...")
    try:
        analysis_trigger_cloud(stock['symbol'], stock['name'])
    except Exception as e:
        print(f"Error caching {stock['name']}: {e}")

print("Pre-caching complete!")
