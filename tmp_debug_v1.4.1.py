import sys
import os
import random

# backend 경로 추가
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from scraper import analysis_trigger_cloud

stocks = [
    ("247540", "에코프로"),
    ("012450", "한화에어로스페이스"),
    ("000250", "삼천당제약")
]

print("=== v1.4.1 Sentiment Analysis Debug ===")
for symbol, name in stocks:
    try:
        result = analysis_trigger_cloud(symbol, name, force_refresh=True)
        score = result.get("sentiment_score", 0)
        reports = result.get("total_report_count", 0)
        print(f"[{symbol}] {name:15}: Score={score:8.4f}, Reports={reports:2d}")
    except Exception as e:
        print(f"[{symbol}] {name} Error: {e}")
print("-" * 50)
