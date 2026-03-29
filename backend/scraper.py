import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from datetime import datetime, timedelta
import time
from functools import lru_cache

# 브라우저처럼 보이게 하기 위한 User-Agent 설정
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

# 요청 간격을 위한 글로벌 타임스탬프
last_request_time = 0
MIN_DELAY_BETWEEN_REQUESTS = 0.5  # 500ms 지연 최소화

# 광고성 기사 필터링 점수 (User 가이드 반영)
AD_SCORES = {
    "direct": ["[AD]", "(광고)", "제작지원", "기획기사", "PR", "유료공고"],
    "hype": ["제2의", "폭등임박", "상한가 직행", "1000% 수익", "역대급", "비밀리에", "독점공개", "긴급속보", "세력 매집", "점상한가"],
    "cta": ["카톡방", "무료입장", "선착순", "전문가 리딩", "체험하기", "링크 클릭", "번호 남기기", "텔레그램"]
}

def clean_news_filter(title, content=""):
    """
    가중치 기반 클린 뉴스 필터 (Scoring)
    - 점수가 10점 이상이면 광고로 분류
    """
    score = 0
    
    # 1. 직접 광고 키워드 (각 10점 - 즉시 필터)
    for kw in AD_SCORES["direct"]:
        if kw in title: score += 10
        
    # 2. 자극적 키워드 (각 4점)
    for kw in AD_SCORES["hype"]:
        if kw in title: score += 4
        
    # 3. CTA 유도 키워드 (각 5점)
    for kw in AD_SCORES["cta"]:
        if kw in title: score += 5
        
    # 4. 정규표현식 패턴 (특수문자 과도 사용 등)
    if re.search(r'[▶▼★◀【]+', title): score += 3
    if re.search(r'\d{3}-\d{4}-\d{4}', title + content): score += 10 # 전화번호
    
    return score < 10

def _apply_rate_limit():
    """
    네이버 제재 방지를 위한 요청 간격 조정
    """
    global last_request_time
    now = time.time()
    elapsed = now - last_request_time
    if elapsed < MIN_DELAY_BETWEEN_REQUESTS:
        time.sleep(MIN_DELAY_BETWEEN_REQUESTS - elapsed)
    last_request_time = time.time()

@lru_cache(maxsize=100)
def fetch_stock_ohlcv(symbol, days=70):
    """
    Naver Finance를 통한 주가 데이터 수집 (일봉 차트용)
    - 캐싱 및 타임아웃(5초) 적용
    """
    _apply_rate_limit() # 속도 제한 적용
    
    url = f"https://fchart.naver.com/sise.nhn?symbol={symbol}&timeframe=day&count={days}&requestType=0"
    try:
        # 타임아웃과 헤더 추가 (필수)
        response = requests.get(url, headers=HEADERS, timeout=5)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return None

def fetch_news_keywords(stock_name):
    """
    Naver News 검색 결과 크롤링 및 필터링
    """
    # 실제 구현 시 Naver Search API(Client ID/Secret) 필요
    # 현재는 비로그인 크롤링 또는 Mock 데이터 처리
    news_list = [
        {"title": f"{stock_name} 기록적인 실적 발표", "content": "..."},
        {"title": "[AD] 이번주 급등 예상 종목 공개", "content": "..."}, # 광고
        {"title": f"{stock_name} 반도체 대규모 투자 공고", "content": "..."},
    ]
    
    filtered_news = [n for n in news_list if clean_news_filter(n['title'])]
    return filtered_news
