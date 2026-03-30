import requests
from bs4 import BeautifulSoup

def check_link():
    url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode=353200"
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    soup = BeautifulSoup(resp.content, 'html.parser')
    
    links = soup.select('table.type_1 tr td a')
    for link in links[:3]:
        print(f"Text: |{link.text.strip()}|")
        print(f"Title Attr: |{link.get('title')}|")
        print(f"Href: |{link.get('href')}|")

check_link()
