import json
import os

def fix():
    path = os.path.join("backend", "stock_industry.json")
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 주요 조선 관련 종목 업종 보강
    fixes = {
        "329180": "조선", # HD현대중공업
        "010140": "조선", # 삼성중공업
        "042660": "조선", # 한화오션
        "009540": "조선", # HD한국조선해양
        "010620": "조선", # HD현대미포
        "071970": "조선", # STX중공업
        "082740": "조선기자재", # 한화엔진
        "077970": "조선기자재", # STX엔진
    }
    
    for code, ind in fixes.items():
        if code in data:
            data[code]["industry"] = ind
            
    # 플러스: "운송장비" 중에서 '중공업'이 들어가는 종목들도 체크
    for code, info in data.items():
        name = info.get("name", "")
        industry = info.get("industry", "")
        if "중공업" in name and (industry == "운송장비" or industry == "운송장비·부품"):
           info["industry"] = "조선"

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Industry map updated for shipbuilding stocks.")

if __name__ == "__main__":
    fix()
