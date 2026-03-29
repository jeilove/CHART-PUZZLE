import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

def fetch_news(stock_name):
    url = f"https://search.naver.com/search.naver?where=news&query={stock_name}&sort=1"
    print(f"Fetching: {url}")
    response = requests.get(url, headers=HEADERS)
    print(f"Status: {response.status_code}")
    
    soup = BeautifulSoup(response.text, "html.parser")
    news_items = soup.select("ul.list_news > li")
    print(f"Found {len(news_items)} items")
    
    for i, item in enumerate(news_items):
        title_tag = item.select_one("a.news_tit")
        if title_tag:
            print(f"{i+1}: {title_tag.get_text(strip=True)}")

if __name__ == "__main__":
    fetch_news("삼성전자")
