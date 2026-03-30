import requests

symbol = "066970" # L&F
target_url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
jina_url = f"https://r.jina.ai/{target_url}"
headers = {"User-Agent": "Mozilla/5.0"}

try:
    response = requests.get(jina_url, headers=headers, timeout=10)
    print("Content Length:", len(response.text))
    print("Preview (First 1000 chars):")
    print(response.text[:1000])
    
    # Check if '신작' is in there
    if '신작' in response.text:
        print("\n[ALERT] Found '신작' in FnGuide report text!")
        # Find context around '신작'
        idx = response.text.find('신작')
        print("Context:", response.text[idx-50:idx+50])
except Exception as e:
    print(f"Error: {e}")
