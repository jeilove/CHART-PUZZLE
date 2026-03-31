import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from datetime import datetime, timedelta
import time
import json
import os
from functools import lru_cache
import math

# 브라우저처럼 보이게 하기 위한 User-Agent 설정
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

# v0.8.0: 전체 종목 업종 매핑 데이터 로드
INDUSTRY_MAP = {}
try:
    map_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stock_industry.json")
    if os.path.exists(map_path):
        with open(map_path, "r", encoding="utf-8") as f:
            INDUSTRY_MAP = json.load(f)
        print(f"Loaded {len(INDUSTRY_MAP)} stocks industry data.")
except Exception as e:
    print(f"Error loading industry map: {e}")

# 요청 간격을 위한 글로벌 타임스탬프
last_request_time = 0
MIN_DELAY_BETWEEN_REQUESTS = 0.5  # 500ms 지연 최소화

# 광고성 기사 필터링 점수 (User 가이드 반영)
AD_SCORES = {
    "direct": ["[AD]", "(광고)", "제작지원", "기획기사", "PR", "유료공고"],
    "hype": ["제2의", "폭등임박", "상한가 직행", "1000% 수익", "역대급", "비밀리에", "독점공개", "긴급속보", "세력 매집", "점상한가"],
    "cta": ["카톡방", "무료입장", "선착순", "전문가 리딩", "체험하기", "링크 클릭", "번호 남기기", "텔레그램"]
}

# 지수적 감쇠 계수 (금융공학 보편적 수치 0.1 설정)
# λ가 높을수록 최근 데이터에 더 민감함
DECAY_LAMBDA = 0.1

# 트리거 용어 사전 (사용자 제공 문서 반영)
TRIGGER_KEYWORDS = {
    "positive": [
        "어닝 서프라이즈", "흑자전환", "영업레버리지", "수익성 개선", "믹스 개선", "턴어라운드", "컨세서스 상회", "사상 최대 실적", "밸류에이션 매력", "업사이클",
        "마진 레버리지 확대", "ASP 상승", "가격 상승", "고정비 레버리지", "비용 효율화", "구조 개선", "현금흐름 개선", "FCF 개선", "ROE 개선", "ROIC 개선",
        "디레버리징", "P·Q 동반 상승", "OPM 개선", "캐시카우", "기술 이전", "L/O", "임상 성공", "양산 개시", "독점적 지위", "공급계약 체결",
        "수주 회복", "신사업 가시화", "진입장벽 강화", "고성장", "고객사 다변화", "신규 고객사 확보", "수주 가시성", "레퍼런스 확대", "플랫폼 확장성", "기술 경쟁력 강화",
        "경제적 해자", "생태계 확장", "퍼스트 무버", "자사주 소각", "배당 확대", "무상증자", "리레이팅", "Re-rating", "기업가치 제고", "공격적 증설",
        "M&A 시너지", "주주환원 정책 강화", "배당 성향 확대", "자본 효율성 개선", "지배구조 개선", "거버넌스 디스카운트 해소", "행동주의 펀드 제안 수용",
        "구조적 성장", "상승 사이클", "공급 부족", "가격 인상", "낙수효과", "독보적 점유율", "규제 완화", "국산화 성공", "수요 회복 가속화", "구조적 수요 증가",
        "산업 재편 수혜", "정책 수혜", "골디락스", "숏티지", "Shortage", "최선호주", "Top Pick", "신고가", "업사이드 리스크", "비중확대", "Overweight"
    ],
    "negative": [
        "어닝 쇼크", "적자전환", "역성장", "저마진", "실적 하향", "컨센서스 하회", "비용 부담", "자본 잠식", "영업적자", "다운사이클",
        "마진 훼손", "비용 구조 악화", "현금흐름 악화", "재무구조 부담", "차입 부담 증가", "키친 싱킹", "Kitchen Sinking", "고정비 부담 가중",
        "임상 실패", "계약 해지", "공급 과잉", "열위", "신규 진입자 발생", "파이프라인 중단", "사업 철수", "저성장", "고객사 이탈", "수주 취소",
        "경쟁 심화", "시장 진입 실패", "기술 경쟁력 약화", "카니발라이제이션", "Cannibalization", "기술적 진부화", "유상증자(채무상환)", "오버행", "Overhang",
        "대주주 지분 매각", "감자", "불성실 공시", "횡령", "배임", "희석 우려", "재무 리스크 확대", "신용등급 하향", "블록딜 대기", "지주사 할인",
        "피크 아웃", "Peak-out", "하락 사이클", "가격 경쟁 심화", "규제 강화", "보급률 포화", "보호무역", "수요 둔화", "재고 부담 확대", "가격 하락 압력",
        "공급 과잉 심화", "스태그플레이션 우려", "구조적 저성장", "부정적", "불가피", "신저가", "다운 사이드 리스크", "투자 매력 제한적", "모멘텀 부재",
        "비중축소", "Underweight", "밸류 트랩", "모멘텀 슬로우다운"
    ],
    "neutral": [
        "컨센서스 부합", "실적 전망", "수익성 안정화", "일회성 비용", "가동률 회복", "재고 조정", "기저 효과", "낙수효과", "보수적 가이던스",
        "실적 가시성 제한적", "변동성 확대", "단기 실적 왜곡", "추정치 유지", "기고효과", "Base Effect", "수주 잔고", "레퍼런스 확보", "차세대 모델",
        "상용화 준비", "가이던스 제시", "진출 검토", "전략적 제휴", "신작", "파일럿 단계", "검증 진행 중", "초기 단계", "적용 가능성 확인", "자사주 매입",
        "유상증자(운영자금)", "담보 대출", "지분 구조 재편", "인수 검토", "유동성 자본 확보", "최대주주 변경", "업황 회복 기대", "벨류체인 편입",
        "시장 점유율 유지", "경기 민감도", "규제 리스크", "현지진출", "방향성 탐색 구간", "불확실성 지속", "관망세", "금리 방향성 주시", "박스권",
        "긍정적", "가시성", "시너지", "제한적 업사이드", "벨류에이션 부담", "트리거 대기", "중립", "Neutral", "인라인", "In-line"
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

def _parse_date_to_days_ago(date_str):
    """
    다양한 날짜 포맷을 분석하여 현재로부터 며칠 전인지 반환 (Delta t)
    - Google RSS: "Tue, 25 Mar 2026 05:30:00 GMT" (RFC 822)
    - Naver: "26.03.31"
    - FnGuide: "26/03/31"
    """
    if not date_str: return 0
    now = datetime.now()
    
    try:
        # 1. Google RSS (RFC 822) - 앞 16자 정도만 사용 ("Tue, 25 Mar 2026")
        if "," in date_str:
            # "Tue, 25 Mar 2026 05:30:00 GMT" -> "25 Mar 2026"
            parts = date_str.split(" ")
            clean_date = f"{parts[1]} {parts[2]} {parts[3]}"
            dt = datetime.strptime(clean_date, "%d %b %Y")
        # 2. Naver/FnGuide 스타일
        else:
            clean_date = date_str.replace("/", ".").strip()
            # 24.03.31 -> 2024.03.31
            if clean_date.count(".") == 2:
                parts = clean_date.split(".")
                if len(parts[0]) == 2: # "24" -> "2024"
                    parts[0] = "20" + parts[0]
                clean_date = ".".join(parts)
                dt = datetime.strptime(clean_date, "%Y.%m.%d")
            else:
                return 0
                
        delta = (now - dt).days
        return max(0, delta) # 미래 날짜 방지
    except Exception as e:
        # print(f"Date parse error ({date_str}): {e}")
        return 0

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
    네이버 자동완성 API 및 내부 업종 DB를 사용하여 종목명/코드/업종 통합 검색 (v0.8.0)
    """
    if not query: return []
    query = query.strip().upper()
    
    results_map = {} # symbol -> {name, symbol, industry} 중복 방지용
    
    # 1. 내부 업종 DB에서 매칭되는 종목 먼저 검색 (업종명/종목명/코드 통합 검색)
    if INDUSTRY_MAP:
        for code, info in INDUSTRY_MAP.items():
            # info = {"name": "...", "industry": "..."}
            name = info.get("name", "")
            industry = info.get("industry", "")
            
            # 검색어가 업종명, 종목명, 종목코드 중 하나에라도 포함되면 결과에 추가
            if (query in industry.upper() or 
                query in name.upper() or 
                query in code.upper()):
                results_map[code] = {
                    "name": name,
                    "symbol": code,
                    "industry": industry
                }
            
            # 너무 많은 결과 방지를 위해 1차적으로 30개 제한
            if len(results_map) >= 30:
                break

    try:
        # 2. 네이버 API를 통한 실시간 이름/코드 검색 (내부 DB에 없는 신규 종목 대응)
        url = f"https://ac.stock.naver.com/ac?q={query}&target=stock"
        response = requests.get(url, headers=HEADERS, timeout=3)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            
            for item in items:
                name = item.get("name")
                code = item.get("code")
                if name and code and code not in results_map:
                    # 네이버 API 결과는 내부 DB에서 업종 정보를 보강하여 추가
                    # 내부 DB에 정보가 없다면 '일반분류' 표시
                    info = INDUSTRY_MAP.get(code, {})
                    industry = info.get("industry", "일반분류")
                    
                    results_map[code] = {
                        "name": name,
                        "symbol": code,
                        "industry": industry
                    }
            
        return list(results_map.values())[:30]
    except Exception as e:
        print(f"Search error: {e}")
        # API 오류가 나더라도 로컬 검색 결과는 반환
        return list(results_map.values())

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
            pub_date = item.pubDate.text if item.pubDate else ""
            
            # 구글 뉴스 제목 끝부분의 ' - 언론사명' 제거
            if " - " in title:
                title = " - ".join(title.split(" - ")[:-1])
                
            if not title or not link:
                continue
                
            # 광고 및 노이즈 필터링
            if clean_news_filter(title):
                results.append({
                    "title": title.strip(),
                    "link": link.strip(),
                    "date": pub_date
                })
                
            if len(results) >= 5:
                break
                
        return results
    except Exception as e:
        print(f"News fetch error for {stock_name}: {e}")
        return []

@lru_cache(maxsize=100)
def fetch_reports_combined(symbol, stock_name):
    """
    네이버 리서치(제목)와 FnGuide(요약)를 결합하여 풍부한 키워드 소침 확보.
    가중치 계산을 위해 텍스트와 날짜를 리스트 형태로 반환.
    """
    _apply_rate_limit()
    sources = [] # list of {"text": str, "date": str}
    
    # 1. 네이버 리서치 제목 수집 (최근 3페이지)
    try:
        for page in range(1, 4):
            url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode={symbol}&page={page}"
            resp = requests.get(url, headers=HEADERS, timeout=5)
            soup = BeautifulSoup(resp.content, 'html.parser')
            for row in soup.select('table.type_1 tr'):
                tds = row.find_all('td')
                if len(tds) >= 4:
                    title_tag = tds[1].find('a')
                    date_node = tds[4]
                    if title_tag and date_node.text.strip():
                        sources.append({
                            "text": title_tag.text.strip(),
                            "date": date_node.text.strip()
                        })
    except Exception as e:
        print(f"Naver fetch error: {e}")

    # 리포트 요약 내용 수집
    target_urls = [
        f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
    ]
    
    for base_url in target_urls:
        try:
            jina_url = f"https://r.jina.ai/{base_url}"
            resp = requests.get(jina_url, headers=HEADERS, timeout=6) 
            if resp.status_code == 200:
                lines = resp.text.split('\n')
                for line in lines:
                    if f"A{symbol}" in line or stock_name in line or "A" + symbol in line:
                        date_match = re.search(r'\d{2}/\d{2}/\d{2}', line)
                        if date_match:
                            sources.append({
                                "text": line.strip(),
                                "date": date_match.group()
                            })
        except Exception as e:
            print(f"FnGuide Jina timeout: {e}")
            
    return sources

# 캐시 저장 경로 설정
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def _get_cache_path(symbol):
    return os.path.join(CACHE_DIR, f"{symbol}.json")

def _read_cache(symbol):
    path = _get_cache_path(symbol)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return None
    return None

def _write_cache(symbol, data):
    path = _get_cache_path(symbol)
    data["timestamp"] = time.time() # 저장 시점 기록
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Cache write error: {e}")

def analysis_trigger_cloud(symbol, stock_name, force_refresh=False):
    """
    리포트 텍스트 분석 및 트리거 클라우드 데이터 생성 (캐시 시스템 고도화)
    """
    # 1. 캐시 확인 (강제 갱신이 아니며, 24시간 이내인 경우)
    if not force_refresh:
        cached = _read_cache(symbol)
        if cached and time.time() - cached.get("timestamp", 0) < 86400:
            # 유효한 키워드가 있는 캐시만 즉시 반환
            if len(cached.get("cloud", [])) > 0:
                print(f"[{symbol}] Returning valid cached results.")
                cached["is_fresh"] = False
                return cached
            else:
                print(f"[{symbol}] Cached result was empty. Re-fetching...")
    else:
        print(f"[{symbol}] Force Refresh requested. Bypassing cache.")

    # 2. 데이터 직접 수집 (타임아웃 강화)
    print(f"[{symbol}] Fetching multi-source data (Force={force_refresh})...")
    
    # 여러 소스를 결합 (리스트 형태 유지)
    all_sources = fetch_reports_combined(symbol, stock_name)
    
    # 뉴스 키워드 추가
    news = fetch_news_keywords(stock_name)
    for n in news:
        all_sources.append({
            "text": n["title"],
            "date": n["date"]
        })

    keyword_weights = {} # {keyword: total_weighted_count}
    sentiment_score = 0
    all_dates = []
    
    for source in all_sources:
        text = source["text"]
        date_str = source["date"]
        all_dates.append(date_str)
        
        # 지수적 감쇠 가중치 계산
        delta_t = _parse_date_to_days_ago(date_str)
        weight = math.exp(-DECAY_LAMBDA * delta_t)
        
        # 키워드 매칭
        for sentiment, keywords in TRIGGER_KEYWORDS.items():
            for kw in keywords:
                count = text.count(kw)
                if count > 0:
                    weighted_val = count * weight
                    keyword_weights[kw] = keyword_weights.get(kw, 0) + weighted_val
                    
                    if sentiment == "positive":
                        sentiment_score += weighted_val
                    elif sentiment == "negative":
                        sentiment_score -= weighted_val

    # 클라우드용 데이터 정제
    cloud_data = []
    for kw, val in keyword_weights.items():
        # 어느 카테고리인지 다시 확인
        sentiment = "neutral"
        if kw in TRIGGER_KEYWORDS["positive"]: sentiment = "positive"
        elif kw in TRIGGER_KEYWORDS["negative"]: sentiment = "negative"
        
        cloud_data.append({
            "text": kw,
            "value": min(40, 10 + (val * 10)), # 가중치 반영하여 크기 조절
            "sentiment": sentiment
        })
    
    # 상위 20개 키워드만 유지 (가중치 순)
    cloud_data = sorted(cloud_data, key=lambda x: x["value"], reverse=True)[:20]

    # 주가 반영률(Gap Index) 계산
    ohlcv = fetch_stock_ohlcv(symbol, days=21)
    price_change = 0
    if ohlcv and len(ohlcv) >= 20:
        start_price = ohlcv[0]["close"]
        end_price = ohlcv[-1]["close"]
        price_change = ((end_price - start_price) / start_price) * 100

    gap_comment = ""
    # 가중치 적용으로 인해 score가 소수점이 될 수 있음
    if sentiment_score >= 1.5 and price_change <= 5:
        gap_comment = "호재 키워드 다수 출현 중이나 주가 미반영 상태 (매수 기회 분석 필요)"
    elif sentiment_score >= 0.8 and price_change >= 20:
        gap_comment = "호재 키워드 반영 완료 및 단기 과열 양상 (추격 매수 주의)"
    elif sentiment_score <= -1.5 and price_change >= -5:
        gap_comment = "악재 키워드 출현 중이나 하락 미반영 (리스크 관리 주의)"

    sorted_dates = sorted(list(set(all_dates)), reverse=True)
    
    result = {
        "cloud": cloud_data[:20],
        "sentiment_score": sentiment_score,
        "price_change_20d": round(price_change, 2),
        "gap_comment": gap_comment,
        "report_dates": sorted_dates[:10],
        "total_report_count": len(sorted_dates),
        "is_fresh": True
    }
    
    # 결과가 존재할 때만 24시간 캐싱 (실패 시 캐싱 안함)
    if len(cloud_data) > 0:
        _write_cache(symbol, result)
    else:
        print(f"[{symbol}] Analysis returned empty. Skipping long-term cache.")
        
    return result
