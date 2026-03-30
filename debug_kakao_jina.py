import requests

def debug_kakao():
    url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A035720&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
    jina_url = f"https://r.jina.ai/{url}"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    resp = requests.get(jina_url, headers=headers, timeout=10)
    text = resp.text
    
    with open('kakao_jina_full.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Dumped kakao_jina_full.txt")
    
debug_kakao()
