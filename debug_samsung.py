import sys
import os
import json
import math
import re

# 백엔드 모듈 임포트를 위해 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.scraper import analysis_trigger_cloud, TRIGGER_KEYWORDS, fetch_reports_combined, fetch_news_keywords

def debug_samsung():
    symbol = "005930"
    name = "삼성전자"
    
    print(f"\n[DEBUG] {name} ({symbol}) 정밀 분석 시작...")
    
    # 캐시 무시하고 강제 새로고침 분석
    # 1. 원 데이터 수집 과정 노출
    print("\n1. 데이터 소스 수집 중...")
    reports = fetch_reports_combined(symbol, name)
    news = fetch_news_keywords(name)
    
    print(f" - 리서치 리포트: {len(reports)}건 수집됨")
    print(f" - 일반 뉴스: {len(news)}건 수집됨")
    
    # 2. 분석 엔진 실행 및 상세 로그
    print("\n2. 감성 엔진 구동 (v1.3.6 로직 적용)...")
    analysis = analysis_trigger_cloud(symbol, name, force_refresh=True)
    
    print("-" * 50)
    print(f"최종 감성 점수: {analysis.get('sentiment_score', 0):.4f}")
    print("-" * 50)
    
    # 3. 긍정/부정 기여도 상위 키워드 확인
    cloud = analysis.get("cloud", [])
    pos_items = sorted([item for item in cloud if item.get("sentiment") == "positive"], key=lambda x: x["value"], reverse=True)
    neg_items = sorted([item for item in cloud if item.get("sentiment") == "negative"], key=lambda x: x["value"], reverse=True)
    
    print("\n[긍정 기여 키워드 Top 5]")
    for item in pos_items[:5]:
        print(f" - {item['text']}: {item['value']:.2f}")
        
    print("\n[부정 기여 키워드 Top 5]")
    for item in neg_items[:5]:
        print(f" - {item['text']}: {item['value']:.2f}")

    # 4. 원문 샘플 (첫 5개 리포트 텍스트 덤프 - 현미경 분석용)
    print("\n[데이터 원문 덤프 - 샘플 5건]")
    for i, r in enumerate(reports[:5]):
        print(f"\n--- Report {i+1} ({r.get('date', 'Unknown')}) ---")
        full_text = r.get("text", "")
        # 500자 출력
        snippet = full_text[:500]
        print(snippet + ("..." if len(full_text) > 500 else ""))

if __name__ == "__main__":
    debug_samsung()
