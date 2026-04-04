import requests
import json

def test_sparklines():
    symbol = "005930" # Samsung
    
    # Day
    res_day = requests.get(f"http://127.0.0.1:8000/api/stock/sparkline/batch?symbols={symbol}&timeframe=day&count=10")
    data_day = res_day.json().get(symbol, [])
    
    # Minute
    res_min = requests.get(f"http://127.0.0.1:8000/api/stock/sparkline/batch?symbols={symbol}&timeframe=minute&count=10")
    data_min = res_min.json().get(symbol, [])
    
    print(f"Day data (10): {data_day}")
    print(f"Minute data (10): {data_min}")

if __name__ == "__main__":
    test_sparklines()
