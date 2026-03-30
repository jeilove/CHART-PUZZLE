import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from datetime import datetime, timedelta
import time
from functools import lru_cache
import math

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

# 트리거 용어 사전 (사용자 제공 문서 반영)
TRIGGER_KEYWORDS = {
    "positive": [
        "어어닝 서프라이즈", "흑자전환", "영업레버리지", "수익성 개선", "믹스 개선", "턴어라운드", "사상 최대 실적", "밸류에이션 매력", "업사이클",
        "기술 이전", "임상 성공", "양산 개시", "독점적 지위", "공급계약 체결", "수주 회복", "신사업 가시화", "진입장벽 강화", "고성장",
        "자사주 소각", "배당 확대", "무상증자", "리레이팅", "기업가치 제고", "공격적 증설", "M&A 시너지",
        "구조적 성장", "상승 사이클", "공급 부족", "가격 인상", "낙수효과", "독보적 점유율", "규제 완화", "국산화 성공", "최선호주", "Top Pick"
    ],
    "negative": [
        "어닝 쇼크", "적자전환", "역성장", "저마진", "실적 하향", "컨센서스 하회", "비용 부담", "자본 잠식", "영업적자", "다운사이클",
        "임상 실패", "계약 해지", "공급 과잉", "열위", "신규 진입자 발생", "파이프라인 중단", "사업 철수", "저성장",
        "유상증자(채무상환)", "오버행", "대주주 지분 매각", "감자", "불성실 공시", "횡령", "배임",
        "피크 아웃", "하락 사이클", "가격 경쟁 심화", "규제 강화", "포화", "보호무역", "부정적", "불가피"
    ],
    "neutral": [
        "컨센서스 부합", "실적 전망", "수익성 안정화", "일회성 비용", "가동률 회복", "재고 조정", "기저 효과",
        "수주 잔고", "레퍼런스 확보", "차세대 모델", "상용화 준비", "가이던스 제시", "진출 검토", "전략적 제휴", "신작",
        "자사주 매입", "유상증자(운영자금)", "담보 대출", "지분 구조 재편", "인수 검토", "유동성 확보",
        "업황 회복 기대", "벨류체인 편입", "시장 점유율 유지", "경기 민감도", "규제 리스크", "변동성 확대", "긍정적", "가시성", "시너지"
    ]
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
    구글 뉴스 RSS를 사용한 뉴스 기사 수집 (네이버 방화벽 이슈 등 우회)
    """
    _apply_rate_limit()
    
    # Google News RSS URL
    url = f"https://news.google.com/rss/search?q={stock_name}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        response = requests.get(url, headers=HEADERS, timeout=5)
        response.raise_for_status()
        
        # XML 파싱
        # lxml 또는 내장 xml 파서 사용 (lxml이 설치되어 있다면 lxml 사용 권장)
        try:
            soup = BeautifulSoup(response.content, "xml")
        except Exception:
            soup = BeautifulSoup(response.content, "html.parser")
            
        items = soup.find_all("item")
            
        results = []
        for item in items:
            title = item.title.text if item.title else ""
            link = item.link.text if item.link else ""
            
            # 구글 뉴스 제목 끝부분의 ' - 언론사명' 제거
            if " - " in title:
                title = " - ".join(title.split(" - ")[:-1])
                
            if not title or not link:
                continue
                
            # 광고 및 노이즈 필터링
            if clean_news_filter(title):
                results.append({
                    "title": title.strip(),
                    "link": link.strip()
                })
                
            if len(results) >= 5:
                break
                
        return results
    except Exception as e:
        print(f"News fetch error for {stock_name}: {e}")
        return []

@lru_cache(maxsize=100)
def fetch_fnguide_reports(symbol):
    """
    Jina Reader (r.jina.ai)를 활용한 FnGuide 리포트 요약 크롤링
    안정성과 정제된 텍스트 데이터를 위해 Jina를 경유함
    """
    _apply_rate_limit()
    target_url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
    jina_url = f"https://r.jina.ai/{target_url}"
    
    try:
        # Jina Reader는 응답이 느릴 수 있으므로 타임아웃을 8초로 넉넉히 설정 (글로벌 지침 준수)
        response = requests.get(jina_url, headers=HEADERS, timeout=8)
        response.raise_for_status()
        
        # Jina는 정제된 Markdown/Text 형식을 반환하므로 HTML 파싱이 불필요함
        content = response.text
        
        # 불필요한 메타 정보나 링크 제거 (Jina 특유의 Header/Footer)
        if "### Summary" in content:
            content = content.split("### Summary")[-1]
            
        return content.strip()
    except Exception as e:
        print(f"FnGuide Jina fetch error for {symbol}: {e}")
        return ""

def analysis_trigger_cloud(symbol, stock_name):
    """
    리포트 텍스트 분석 및 트리거 클라우드 데이터 생성
    """
    report_text = fetch_fnguide_reports(symbol)
    if not report_text:
        # 리포트가 없으면 구글 뉴스 RSS 제목 활용 (Fallback)
        news = fetch_news_keywords(stock_name)
        report_text = " ".join([n["title"] for n in news])

    cloud_data = []
    sentiment_score = 0
    
    # 키워드 매칭 및 카운팅
    for sentiment, keywords in TRIGGER_KEYWORDS.items():
        for kw in keywords:
            count = report_text.count(kw)
            if count > 0:
                cloud_data.append({
                    "text": kw,
                    "value": 10 + (count * 5), # 빈도에 따른 크기 가중치
                    "sentiment": sentiment
                })
                if sentiment == "positive": sentiment_score += count
                elif sentiment == "negative": sentiment_score -= count

    # 주가 반영률(Gap Index) 계산
    # 최근 20거래일 수익률 확인
    ohlcv = fetch_stock_ohlcv(symbol, days=21)
    price_change = 0
    if ohlcv and len(ohlcv) >= 20:
        start_price = ohlcv[0]["close"]
        end_price = ohlcv[-1]["close"]
        price_change = ((end_price - start_price) / start_price) * 100

    # 선반영 여부 멘트 생성 (사용자 로직 반영)
    gap_comment = ""
    # 호재는 많은데 주가는 하락 또는 횡보 (미반반영)
    if sentiment_score >= 2 and price_change <= 5:
        gap_comment = "호재 키워드 다수 출현 중이나 주가 미반영 상태 (매수 기회 분석 필요)"
    # 호재 출현 후 이미 주가 20% 상승 (선반영 완료)
    elif sentiment_score >= 1 and price_change >= 20:
        gap_comment = "호재 키워드 반영 완료 및 단기 과열 양상 (추격 매수 주의)"
    elif sentiment_score <= -2 and price_change >= -5:
        gap_comment = "악재 키워드 출현 중이나 하락 미반영 (리스크 관리 주의)"

    return {
        "cloud": cloud_data[:20], # 상위 20개만
        "sentiment_score": sentiment_score,
        "price_change_20d": round(price_change, 2),
        "gap_comment": gap_comment
    }
