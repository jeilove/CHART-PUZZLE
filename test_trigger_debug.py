import requests

symbol = "035720" # Kakao
target_url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
jina_url = f"https://r.jina.ai/{target_url}"
headers = {"User-Agent": "Mozilla/5.0"}

response = requests.get(jina_url, headers=headers, timeout=10)
text = response.text

with open('jina_kakao_dump.md', 'w', encoding='utf-8') as f:
    f.write(text)
print("Dumped complete")
