import requests
from bs4 import BeautifulSoup

symbol = "035720"
url = f"https://comp.fnguide.com/SVO2/ASP/SVD_Report_Summary.asp?pGB=1&gicode=A{symbol}&cID=&MenuYn=Y&ReportGB=&NewMenuID=901&stkGb=701"
headers = {"User-Agent": "Mozilla/5.0"}
resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')
tables = soup.find_all('table')
if tables:
    for row in tables[0].find_all('tr')[1:10]: # Skip header
        print(row.text.strip().replace('\n', ' ')[:100])
