import json
import os

def check():
    path = os.path.join("backend", "stock_industry.json")
    if not os.path.exists(path):
        print("Not found")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    found = []
    for code, info in data.items():
        name = info.get("name", "")
        industry = info.get("industry", "")
        if "조선" in name or "조선" in industry:
            found.append({"code": code, "name": name, "industry": industry})
    
    print(f"Total found: {len(found)}")
    for f in found[:30]:
        print(f)

if __name__ == "__main__":
    check()
