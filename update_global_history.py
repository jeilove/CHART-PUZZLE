import os

def update_history():
    path = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"
    new_rule = """
---
## 🛑 [전역 지침] 소스 데이터 전수 사용 및 시각화 무결성 원칙 (v2.2.3)
- **현상**: 주가 변동성(1D 등) 시나리오에서 리소스 절약이나 속도를 이유로 데이터의 일부(예: 최근 2시간분 120개)만 가져와서 그리는 행위 발생.
- **원인**: 에이전트가 '최근'의 의미를 자의적으로 해석하여 장 전체(9:00~15:30) 흐름을 왜곡함.
- **해결책 (절대 원칙)**: 
  1. **소스 데이터 전수 사용**: 테스트 목적이 아닌 정식 기능 구현 시, 반드시 해당 도메인의 '전체 세션' 또는 '사용자가 기대하는 전체 기간'을 포함해야 함.
  2. **1D 분봉 시뮬레이션**: 국내 주식의 경우 개장부터 마감까지 약 390분이며, 넉넉히 400개 이상의 데이터 포인트를 요청하여 **장 전체의 변동성**을 보여주어야 함.
  3. **데이터 왜곡 금지**: 소스 데이터의 일부분만 슬라이싱하여 '그럴듯하게' 보여주는 기만적인 구현을 엄격히 금지함.
  [에이전트실수][데이터시각화][글로벌지침]
"""
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(new_rule)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_history()
