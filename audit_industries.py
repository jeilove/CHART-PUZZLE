import json
import os
from collections import Counter

def audit():
    path = os.path.join("backend", "stock_industry.json")
    if not os.path.exists(path):
        print("Not found")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    industries = []
    for code, info in data.items():
        industries.append(info.get("industry", "N/A"))
    
    counts = Counter(industries)
    print("--- Top 50 Industry Distribution ---")
    for ind, count in counts.most_common(50):
        print(f"{ind}: {count}")
    
    print("\n--- Potential Broad Categories to refine ---")
    broad_list = ["운송장비", "기타금융", "전기장비", "화학", "유통"]
    for broad in broad_list:
        print(f"\nSample of [{broad}]:")
        samples = [info.get("name") for info in data.values() if info.get("industry") == broad][:15]
        print(", ".join(samples))

if __name__ == "__main__":
    audit()
