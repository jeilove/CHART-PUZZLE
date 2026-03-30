import requests
from bs4 import BeautifulSoup
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

def debug_daeduck():
    symbol = "353200"
    stock_name = "대덕전자"
    
    print(f"--- Debugging {stock_name} ({symbol}) ---")
    
    # 1. Test Naver Research
    naver_text = ""
    for page in range(1, 3):
        url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode={symbol}&page={page}"
        print(f"Fetching Naver Page {page}: {url}")
        resp = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.content, 'html.parser')
        
        rows = soup.select('table.type_1 tr')
        print(f"Found {len(rows)} rows in Naver table")
        for row in rows:
            tds = row.find_all('td')
            if len(tds) >= 4:
                title_tag = tds[1].find('a')
                if title_tag:
                    print(f"  [Naver] Found title: {title_tag.text.strip()}")
                    naver_text += title_tag.text.strip() + " "
                    
    # 2. Test FnGuide specific page via Jina
    fnguide_url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
    jina_url = f"https://r.jina.ai/{fnguide_url}"
    print(f"\nFetching FnGuide via Jina: {jina_url}")
    try:
        resp = requests.get(jina_url, headers=HEADERS, timeout=15)
        print(f"Jina Status: {resp.status_code}")
        lines = resp.text.split('\n')
        found_fnguide = False
        for line in lines:
            if f"A{symbol}" in line or stock_name in line:
                print(f"  [FnGuide] Found line matching {symbol}/{stock_name}")
                print(f"    Content: {line[:200]}...")
                found_fnguide = True
        if not found_fnguide:
            print("  [FnGuide] No matching lines found in Jina output.")
    except Exception as e:
        print(f"  [FnGuide] Jina error: {e}")

debug_daeduck()
