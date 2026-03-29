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

def _parse_naver_xml(xml_text):
    """
    네이버 fchart XML 데이터를 OHLCV JSON 리스트로 파싱
    포맷: <item data="20240101|73000|74000|72000|73500|15000000"/>
    """
    if not xml_text: return []
    
    soup = BeautifulSoup(xml_text, "xml")
    items = soup.find_all("item")
    
    parsed_data = []
    for item in items:
        data_str = item.get("data", "")
        if not data_str: continue
        
        parts = data_str.split("|")
        if len(parts) < 6: continue
        
        # 날짜 포맷팅: 20240101 -> 2024-01-01
        dt_str = parts[0]
        formatted_date = f"{dt_str[:4]}-{dt_str[4:6]}-{dt_str[6:]}"
        
        parsed_data.append({
            "time": formatted_date,
            "open": float(parts[1]),
            "high": float(parts[2]),
            "low": float(parts[3]),
            "close": float(parts[4]),
            "volume": int(parts[5])
        })
        
    return parsed_data

@lru_cache(maxsize=100)
def fetch_stock_ohlcv(symbol, timeframe="day", days=100):
    """
    Naver Finance를 통한 주가 데이터 수집 및 파싱
    - timeframe: day, week, month
    - 캐싱 및 타임아웃(5초) 적용
    """
    _apply_rate_limit()
    
    # Naver fchart API timeframe mapping
    # day, week, month -> day, week, month (동일하게 사용 가능)
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe={timeframe}&count={days}&requestType=0"
    try:
        response = requests.get(url, headers=HEADERS, timeout=5)
        response.raise_for_status()
        
        # XML 파싱 후 JSON 반환
        return _parse_naver_xml(response.text)
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return None

def search_stock(query):
    """
    네이버 자동완성 API를 사용하여 종목명/코드 검색
    """
    if not query: return []
    try:
        url = f"https://ac.stock.naver.com/ac?q={query}&target=stock"
        response = requests.get(url, headers=HEADERS, timeout=3)
        response.raise_for_status()
        
        # 네이버 자동완성 API 응답 예시: {"items": [{"code":"005930", "name":"삼성전자", ...}, ...]}
        data = response.json()
        items = data.get("items", [])
        
        results = []
        for item in items:
            name = item.get("name")
            code = item.get("code")
            if name and code:
                results.append({
                    "name": name,
                    "symbol": code
                })
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

def fetch_news_keywords(stock_name):
    """
    네이버 뉴스 검색 크롤링 및 필터링
    """
    _apply_rate_limit()
    
    # Naver Search News URL
    url = f"https://search.naver.com/search.naver?where=news&query={stock_name}&sort=1" # 최신순
    try:
        response = requests.get(url, headers=HEADERS, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 여러 선택자를 시도하여 뉴스 제목 추출
        title_tags = soup.select(".news_tit")
        if not title_tags:
            title_tags = soup.select("a.api_txt_lines.tit")
        if not title_tags:
            title_tags = soup.select(".news_area a.api_txt_lines")
            
        results = []
        for title_tag in title_tags:
            title = title_tag.get_text(strip=True)
            link = title_tag.get("href")
            
            # 광고 및 노이즈 필터링
            if clean_news_filter(title):
                results.append({
                    "title": title,
                    "link": link
                })
        
        # 최대 5개 반환
        return results[:5]
    except Exception as e:
        print(f"News fetch error for {stock_name}: {e}")
        return []
