import requests
from bs4 import BeautifulSoup
import re

symbol = "035720"
url = f"https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode={symbol}"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.content, 'html.parser')

titles = []
dates = []
for row in soup.select('table.type_1 tr'):
    tds = row.find_all('td')
    if len(tds) >= 4:
        title_tag = tds[1].find('a')
        date_node = tds[4] # usually 0: stock, 1: title, 2: broker, 3: file, 4: date, 5: views
        if title_tag and date_node.text.strip():
            titles.append(title_tag.text.strip())
            dates.append(date_node.text.strip())

text = " ".join(titles)
print("Extracted Text:", text)
print("Extracted Dates:", dates)
