import requests

def test_raw_xml():
    symbol = "005930"
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe=minute&count=5&requestType=0"
    res = requests.get(url)
    print(f"Raw XML (minute): {res.text}")

if __name__ == "__main__":
    test_raw_xml()
