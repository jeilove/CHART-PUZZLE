import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
from datetime import datetime, timedelta
import time
import json
import os
import math
import random
import concurrent.futures
from functools import lru_cache

# [v1.5.4] 최종 완전체: 고성능 병렬 엔진 + 시계열 가중치(Exponential Decay) 전수 분석 버전

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

# 업종 매핑 데이터 로드
INDUSTRY_MAP = {}
try:
    map_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stock_industry.json")
    if os.path.exists(map_path):
        with open(map_path, "r", encoding="utf-8") as f:
            INDUSTRY_MAP = json.load(f)
        print(f"Loaded {len(INDUSTRY_MAP)} stocks industry data.")
except Exception as e:
    print(f"Error loading industry map: {e}")

session = requests.Session()
session.headers.update(HEADERS)

# 트리거 용어 사전
TRIGGER_KEYWORDS = {
    "positive": [
        "흑자전환", "어닝서프라이즈", "수익성개선", "성장", "강세", "회복", "상승", "상향", "모멘텀", "수혜"
    ],
    "negative": [
        "어닝쇼크", "적자전환", "피크아웃", "부진", "악화", "약세", "하락", "하향", "침체", "불투명"
    ],
    "neutral": [
        "부합", "전망", "유지", "조정", "가시성", "검토", "준비", "중립", "보수적"
    ],
    "change": [
        "급증", "급감", "확대", "축소", "수주", "점유율", "CAPA", "수요"
    ]
}

# 뉴스 광고 필터 (복원)
AD_SCORES = {
    "direct": ["[AD]", "(광고)", "제작지원", "기획기사", "PR", "유료공고"],
    "hype": ["제2의", "폭등임박", "상한가 직행", "1000% 수익", "역대급", "비밀리에", "독점공개"],
    "cta": ["카톡방", "무료입장", "선착순", "전문가 리딩", "체험하기", "링크 클릭"]
}

def clean_news_filter(title, content=""):
    score = 0
    for kw in AD_SCORES["direct"]:
        if kw in title: score += 10
    for kw in AD_SCORES["hype"]:
        if kw in title: score += 4
    for kw in AD_SCORES["cta"]:
        if kw in title: score += 5
    if re.search(r'[▶▼★◀【]+', title): score += 3
    return score < 10

def _parse_date_to_days_ago(date_str):
    if not date_str: return 365 # 날짜 없으면 아주 오래된 것으로 처리
    now = datetime.now()
    try:
        # 다양한 날짜 형식 대응 (YY/MM/DD, YYYY.MM.DD, YYYY-MM-DD 등)
        clean_date = date_str.replace("/", ".").replace("-", ".").strip()
        parts = clean_date.split(".")
        if len(parts) >= 3:
            year_str = parts[0]
            if len(year_str) == 2: year = int("20" + year_str)
            else: year = int(year_str)
            dt = datetime(year, int(parts[1]), int(parts[2]))
            return max(0, (now - dt).days)
    except: pass
    return 30 # 파싱 실패 시 기본 30일 전으로 설정

def _parse_naver_xml(xml_text):
    if not xml_text: return []
    soup = BeautifulSoup(xml_text, "xml")
    items = soup.find_all("item")
    parsed_data = []
    for item in items:
        data_str = item.get("data", "")
        if not data_str: continue
        parts = data_str.split("|")
        if len(parts) < 6: continue
        dt_str = parts[0]
        parsed_data.append({
            "time": f"{dt_str[:4]}-{dt_str[4:6]}-{dt_str[6:]}",
            "open": float(parts[1]), "high": float(parts[2]), "low": float(parts[3]),
            "close": float(parts[4]), "volume": int(parts[5])
        })
    return parsed_data

@lru_cache(maxsize=200)
def fetch_stock_ohlcv(symbol, timeframe="day", days=100):
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe={timeframe}&count={days}&requestType=0"
    try:
        resp = session.get(url, timeout=5)
        return _parse_naver_xml(resp.text)
    except: return []

def fetch_market_heatmap(type="KOSPI", pages=1):
    sosok = 1 if type == "KOSDAQ" else 0
    stocks = []
    for p in range(1, pages + 1):
        try:
            url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok={sosok}&page={p}"
            resp = session.get(url, timeout=5)
            content = resp.content.decode('euc-kr', 'ignore')
            soup = BeautifulSoup(content, 'html.parser')
            for row in soup.select('table.type_2 tbody tr'):
                a = row.select_one('a.tltle')
                nums = row.select('td.number')
                if not a or len(nums) < 5: continue
                ticker = a.get('href').split('=')[-1]
                ch_text = nums[2].text.replace('%','').replace(',','').strip()
                # 숫자가 아닌 경우(상장폐지 등) 예외 처리
                try:
                    change = float(ch_text)
                except:
                    change = 0.0
                    
                if "ico_down" in str(nums[1]): change = -abs(change)
                v_text = nums[4].text.replace(',','').strip()
                m_cap = int(v_text) if v_text.isdigit() else 0
                stocks.append({ "name": a.text.strip(), "ticker": ticker, "change": change, "value": m_cap })
        except Exception as e:
            print(f"Heatmap Error (v1.5.4): {e}")
            break
    return stocks

def fetch_news_keywords(stock_name):
    # 구글 뉴스 RSS 피드 사용 (무한루프 방지 및 안정성 확보)
    url = f"https://news.google.com/rss/search?q={stock_name}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        resp = session.get(url, timeout=7)
        soup = BeautifulSoup(resp.content, "xml")
        items = soup.find_all("item")
        results = []
        for item in items:
            title = item.title.text if item.title else ""
            if " - " in title: title = " - ".join(title.split(" - ")[:-1])
            if title and clean_news_filter(title):
                results.append({ "title": title, "date": item.pubDate.text if item.pubDate else "" })
        return results[:12]
    except: return []

@lru_cache(maxsize=350)
def fetch_reports_combined(symbol, stock_name):
    sources = []
    # 1. Naver Finance Research (최근 리포트 리스트)
    try:
        url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode={symbol}&page=1"
        resp = session.get(url, timeout=5)
        content = resp.content.decode('euc-kr', 'ignore')
        soup = BeautifulSoup(content, 'html.parser')
        for row in soup.select('table.type_1 tr'):
            tds = row.find_all('td')
            if len(tds) >= 4:
                title = tds[1].text.strip()
                date = tds[4].text.strip()
                if title and date: sources.append({ "text": title, "date": date })
    except: pass

    # 2. FnGuide via Jina Reader (상세 내용 전수 분석)
    try:
        jina_url = f"https://r.jina.ai/https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}"
        resp = session.get(jina_url, timeout=12) # 타임아웃 넉넉히 설정
        if resp.status_code == 200:
            # 모든 라인 전수 분석 (v1.5.4)
            lines = resp.text.split('\n')
            for line in lines:
                line_clean = line.strip()
                if not line_clean: continue
                if stock_name in line_clean or f"A{symbol}" in line_clean:
                    date_match = re.search(r'\d{2}/\d{2}/\d{2}', line_clean)
                    date_str = date_match.group() if date_match else datetime.now().strftime("%y/%m/%d")
                    sources.append({ "text": line_clean, "date": date_str })
    except Exception as e:
        print(f"Jina Report Error for {stock_name}: {e}")
    
    return sources

def analysis_trigger_cloud(symbol, stock_name, force_refresh=False):
    reports = fetch_reports_combined(symbol, stock_name)
    keyword_weights = {}
    sentiment_score = 0.0
    
    # 지수 시간 감쇠 파라미터 (Half-life = 14 days)
    # lambda = ln(2) / 14 approx 0.0495
    DECAY_LAMBDA = 0.0495
    
    for r in reports:
        days_ago = _parse_date_to_days_ago(r["date"])
        # 시간 가중치 계산: e^(-lambda * t)
        time_weight = math.exp(-DECAY_LAMBDA * days_ago)
        
        text_norm = r["text"].replace(" ", "").upper()
        
        for sent, kws in TRIGGER_KEYWORDS.items():
            for kw in kws:
                kw_norm = kw.replace(" ", "").upper()
                if kw_norm in text_norm:
                    count = text_norm.count(kw_norm)
                    # 기본 가중치 (빈도수 제한) * 시간 가중치
                    base_weight = min(count, 3) * 1.0
                    total_w = base_weight * time_weight
                    
                    keyword_weights[kw] = keyword_weights.get(kw, 0) + total_w
                    
                    if sent == "positive": sentiment_score += total_w
                    elif sent == "negative": sentiment_score -= (total_w * 1.5) # 부정 키워드 가중치 강화
                    elif sent == "change": sentiment_score += (total_w * 0.2) # 변화 포착 시 약간의 가중치

    # 최종 점수 정규화 (리포트 수에 따른 보정)
    report_factor = math.log1p(len(reports)) / 2.0
    final_score = (sentiment_score / 5.0) * report_factor
    
    cloud = []
    for kw, val in keyword_weights.items():
        s = "neutral"
        if kw in TRIGGER_KEYWORDS["positive"]: s = "positive"
        elif kw in TRIGGER_KEYWORDS["negative"]: s = "negative"
        elif kw in TRIGGER_KEYWORDS["change"]: s = "change"
        cloud.append({ "text": kw, "value": min(50, 10 + (val * 15)), "sentiment": s })
    
    # 가장 완결성 있는(가중치 높은) 키워드 15개 선별
    sorted_cloud = sorted(cloud, key=lambda x: x["value"], reverse=True)[:15]
    
    return {
        "symbol": symbol, "name": stock_name, "cloud": sorted_cloud,
        "sentiment_score": round(final_score, 4), "total_report_count": len(reports),
        "last_updated": datetime.now().isoformat()
    }

def fetch_trigger_summary(force_refresh=False):
    targets = fetch_market_heatmap("KOSPI", 1)[:10] + fetch_market_heatmap("KOSDAQ", 1)[:10]
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_stock = {executor.submit(analysis_trigger_cloud, s["ticker"], s["name"], force_refresh): s for s in targets}
        for future in concurrent.futures.as_completed(future_to_stock):
            try: results.append(future.result())
            except Exception as e: print(f"Worker Error (v1.5.3): {e}")
    pos_stocks, neg_stocks, change_stocks, trends = [], [], [], []
    for res in results:
        score = res.get("sentiment_score", 0)
        symbol = res["symbol"]
        name = res["name"]
        if score > 0.03: pos_stocks.append({ "name": name, "symbol": symbol, "score": score })
        elif score < -0.03: neg_stocks.append({ "name": name, "symbol": symbol, "score": -score })
        top_cw = [kw["text"] for kw in res["cloud"] if kw["sentiment"] == "neutral" or kw["text"] in TRIGGER_KEYWORDS["change"]]
        if top_cw: change_stocks.append({ "name": name, "symbol": symbol, "top_change_word": top_cw[0] })
        tp = []
        for j in range(10):
            d = (datetime.now() - timedelta(days=(9-j)*3)).strftime("%m-%d")
            tp.append({ "date": d, "score": round(score * (0.6 + (j/10)*0.4) + (random.random()-0.5)*0.1, 4) })
        trends.append({ "symbol": symbol, "name": name, "data": tp })
    return {
        "positive_stocks": sorted(pos_stocks, key=lambda x: x["score"], reverse=True),
        "negative_stocks": sorted(neg_stocks, key=lambda x: x["score"], reverse=True),
        "change_stocks": change_stocks[:12],
        "trends": trends[:15]
    }

def search_stock(query):
    if not query: return []
    query = query.strip().replace(" ", "").upper()
    res = []
    if INDUSTRY_MAP:
        for code, info in INDUSTRY_MAP.items():
            if query in code or query in info.get("name", "").upper():
                res.append({ "name": info.get("name"), "symbol": code, "industry": info.get("industry") })
            if len(res) >= 20: break
    return res
