import requests

def debug_doosan():
    symbol = "336260"
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe=minute&count=500&requestType=0"
    res = requests.get(url)
    print(res.text)

if __name__ == "__main__":
    debug_doosan()
