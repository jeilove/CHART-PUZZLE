# [v1.5.4] 350종목 완전체 분석 엔진 재가동 (KOSPI 200 + KOSDAQ 150)
import sys
import os
import json
import concurrent.futures
from datetime import datetime
import time

# backend 경로 추가
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from scraper import fetch_market_heatmap, analysis_trigger_cloud

def run_full_batch():
    start_time = time.time()
    print(f"[{datetime.now()}] >>> Starting v1.5.4 Full-Market Analysis (350 Stocks) <<<")
    
    # 1. 대상 종목 선정 (KOSPI 200 + KOSDAQ 150 = 350)
    print("Fetching market data...")
    kospi_targets = fetch_market_heatmap("KOSPI", 4)[:200]
    kosdaq_targets = fetch_market_heatmap("KOSDAQ", 3)[:150]
    targets = kospi_targets + kosdaq_targets
    
    results = []
    total = len(targets)
    print(f"Targeting {total} stocks with v1.5.4 Turbo Parallel Engine (workers=12)...")
    
    # 2. 병렬 분석 실행
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        # 각 종목별 분석 작업 제출
        future_to_stock = {executor.submit(analysis_trigger_cloud, s["ticker"], s["name"], True): s for s in targets}
        
        # 완료된 순서대로 결과 처리
        for i, future in enumerate(concurrent.futures.as_completed(future_to_stock), 1):
            stock = future_to_stock[future]
            try:
                # 타임아웃 20초 설정 (개별 종목당)
                data = future.result(timeout=20)
                results.append(data)
                if i % 10 == 0 or i == total:
                    print(f"Progress: {i}/{total} ({ (i/total)*100:.1f}%) completed... Last: {stock['name']}")
            except concurrent.futures.TimeoutError:
                print(f"[{i}/{total}] Timeout Error: {stock['name']} ({stock['ticker']})")
            except Exception as e:
                print(f"[{i}/{total}] Worker Error for {stock['name']}: {e}")

    # 3. 카테고리별 정렬 및 상위 20개 추출 (추출 알고리즘 고도화)
    # Positive: 점수 내림차순
    positive_20 = sorted([r for r in results if r["sentiment_score"] > 0], key=lambda x: x["sentiment_score"], reverse=True)[:20]
    # Negative: 절대값 내림차순 (가장 부정적인 것 우선)
    negative_20 = sorted([r for r in results if r["sentiment_score"] < 0], key=lambda x: x["sentiment_score"])[:20]
    
    # 변화(Change) 상위 20: 'change' 성격의 키워드 가중치가 높은 종목 선별
    def get_change_score(res):
        return sum([k["value"] for k in res["cloud"] if k["sentiment"] == "change"])
    change_20 = sorted(results, key=get_change_score, reverse=True)[:20]
    
    # 감성추세(Trend): 리포트 수가 많으면서 감성이 뚜렷한 종목
    trend_20 = sorted(results, key=lambda x: (abs(x["sentiment_score"]) * (x["total_report_count"] ** 0.5)), reverse=True)[:20]

    report = {
        "version": "v1.5.4",
        "timestamp": datetime.now().isoformat(),
        "elapsed_seconds": round(time.time() - start_time, 2),
        "total_targets": total,
        "processed_count": len(results),
        "positive": [{"name": r["name"], "symbol": r["symbol"], "score": round(r["sentiment_score"], 4), "cloud": r["cloud"][:3]} for r in positive_20],
        "negative": [{"name": r["name"], "symbol": r["symbol"], "score": round(abs(r["sentiment_score"]), 4), "cloud": r["cloud"][:3]} for r in negative_20],
        "change": [{"name": r["name"], "symbol": r["symbol"], "top_word": (r["cloud"][0]["text"] if r["cloud"] else "N/A")} for r in change_20],
        "trend": [{"name": r["name"], "symbol": r["symbol"], "score": round(r["sentiment_score"], 4), "report_count": r["total_report_count"]} for r in trend_20]
    }

    # 파일 저장
    current_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(current_dir, 'trigger_report.json')
    try:
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\n[SUCCESS] Analysis Complete. {len(results)}/{total} stocks analyzed.")
        print(f"Report saved to: {report_path}")
    except Exception as e:
        print(f"[ERROR] Failed to save report: {e}")

    print(f"\n=== [BATCH RESULT TOP 5 Highlights] ===")
    print(f"Positive: {[s['name'] for s in report['positive'][:5]]}")
    print(f"Negative: {[s['name'] for s in report['negative'][:5]]}")
    print(f"Total Time: {report['elapsed_seconds']}s")

if __name__ == "__main__":
    run_full_batch()
