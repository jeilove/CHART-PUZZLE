import requests

def test_sparklines():
    symbol = "005930"
    
    # Day
    res_day = requests.get(f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe=day&count=10&requestType=0")
    print(f"Day (last 2): {res_day.text[:1000]}") # Only first part
    
    # Minute (try timeframe=1)
    res_min = requests.get(f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe=1&count=10&requestType=0")
    print(f"Minute 1 (last 2): {res_min.text[:1000]}")

if __name__ == "__main__":
    test_sparklines()
