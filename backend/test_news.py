import scraper
import json

if __name__ == "__main__":
    news = scraper.fetch_news_keywords("삼성전자")
    print(json.dumps(news, ensure_ascii=False, indent=2))
