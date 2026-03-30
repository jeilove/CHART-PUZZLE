import requests

symbol = "035720" # Kakao
url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode={symbol}"
jina_url = f"https://r.jina.ai/{url}"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(jina_url, headers=headers)
print(resp.text[:1000])
