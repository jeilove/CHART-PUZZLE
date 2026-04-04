import requests

def debug_full_day():
    symbol = "336260" # 두산퓨얼셀
    url = f"https://fchart.stock.naver.com/sise.nhn?symbol={symbol}&timeframe=minute&count=1000&requestType=0"
    res = requests.get(url)
    lines = res.text.split("\n")
    items = [line for line in lines if "<item data=" in line]
    
    print(f"Total items found: {len(items)}")
    if len(items) > 10:
        print("First 5 items:")
        for item in items[:5]: print(item.strip())
        print("Last 5 items:")
        for item in items[-5:]: print(item.strip())
        
        # 9:00 AM data for April 3rd
        target = "202604030900"
        found = [it for it in items if target in it]
        if found:
            print(f"Found 9:00 AM: {found[0].strip()}")
        else:
            # Look for closest to 9:00
            april3 = [it for it in items if "20260403" in it]
            if april3:
                print(f"April 3rd start: {april3[0].strip()}")
                print(f"April 3rd end: {april3[-1].strip()}")

if __name__ == "__main__":
    debug_full_day()
