import json
import os

def refine():
    path = os.path.join("backend", "stock_industry.json")
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 테마별 매핑 (종목코드: 업종명)
    theme_fixes = {
        # 반도체
        "005930": "반도체·전기가전", # 삼성전자
        "000660": "반도체·전기가전", # SK하이닉스
        "042700": "반도체",       # 한미반도체
        "403870": "반도체",       # HPSP
        "036930": "반도체",       # 주성엔지니어링
        "058470": "반도체",       # 리노공업
        "399720": "반도체",       # 가온칩스
        
        # 2차전지
        "373220": "2차전지·에너지", # LG에너지솔루션
        "006400": "2차전지·에너지", # 삼성SDI
        "096770": "2차전지·에너지", # SK이노베이션
        "247540": "2차전지",       # 에코프로
        "247541": "2차전지",       # 에코프로비엠
        "066970": "2차전지",       # 엘앤에프
        "003670": "2차전지",       # 포스코퓨처엠
        "005070": "2차전지",       # 코스모신소재
        "001570": "2차전지",       # 금양
        "348370": "2차전지",       # 엔켐
        
        # 자동차
        "005380": "자동차",       # 현대차
        "000270": "자동차",       # 기아
        "012330": "자동차부품",    # 현대모비스
        "011210": "자동차부품",    # 현대위아
        "204320": "자동차부품",    # HL만도
        
        # 인터넷/플랫폼
        "035420": "인터넷·플랫폼", # NAVER
        "035720": "인터넷·플랫폼", # 카카오
    }
    
    # 데이터 업데이트
    updated_count = 0
    for code, ind in theme_fixes.items():
        if code in data:
            data[code]["industry"] = ind
            updated_count += 1
            
    # 규칙 기반 보정: 지주사
    for code, info in data.items():
        name = info.get("name", "")
        industry = info.get("industry", "")
        if "홀딩스" in name or "지주" in name:
            if industry in ["기타금융", "금융", "일반서비스"]:
                info["industry"] = "지주회사"
                updated_count += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Refinement complete. {updated_count} items updated.")

if __name__ == "__main__":
    refine()
