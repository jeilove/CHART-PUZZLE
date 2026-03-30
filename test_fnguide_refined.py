import requests
import re

def fetch_test(symbol, stock_name):
    url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
    jina_url = f"https://r.jina.ai/{url}"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    resp = requests.get(jina_url, headers=headers, timeout=10)
    text = resp.text
    
    print(f"--- Raw Jina Output for {stock_name} ({symbol}) ---")
    # print(text[:2000]) # View first part
    
    # Try to identify where the "Summary" section starts
    # FnGuide Jina markdown often has "Markdown Content:" or similar
    
    # Split by lines and try to find rows that look like report rows
    # A typical row: "20 23/10/25 StockName A000000 - Title ... Summary content"
    
    report_rows = []
    lines = text.split('\n')
    for line in lines:
        if f"A{symbol}" in line or stock_name in line:
            # This line likely contains a report for our stock
            # But wait, sometimes Jina combines multiple reports into one blob
            report_rows.append(line)
            
    print(f"\n--- Found {len(report_rows)} potential report lines ---")
    for i, row in enumerate(report_rows[:3]):
        print(f"Row {i+1}: {row[:300]}...")

fetch_test("035720", "카카오")
fetch_test("066970", "엘앤에프")
