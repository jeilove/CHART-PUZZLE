import os

gemini_path = r"C:\Users\ACECOM\.gemini\GEMINI.md"

new_rules = """
- [에이전트 개발 원칙 16] **중복 로직 통합 및 하드코딩 금지**: 동일한 기능이나 UI가 파일 내 여러 곳에 중복 존재할 경우, 절대 개별적으로 수정하지 말고 **공통 컴포넌트나 함수로 통합(Refactor)**하여 관리할 것. 땜질식 개별 수정으로 인한 버전 불일치 발생 시 에이전트의 중대한 과실로 간주함.
- [에이전트 개발 원칙 17] **전수 패턴 검증(Full Pattern Search)**: 특정 시각적 요소(예: 스파크라인, 데이터 라벨 등)를 수정할 때, 보고 전 반드시 파일 내 유사한 코드 패턴을 전수 검색(Grep 등)하여 누락된 구간이 없는지 100% 확진할 것.
- [에이전트 개발 원칙 18] **데이터 무결성(No Hardcoding)**: 리스트 아이템이나 동적 데이터 영역에 임시 수치(예: 313.49 등)를 하드코딩하는 행위를 엄격히 금지함. 모든 수치는 반드시 실제 상태값이나 API 데이터와 바인딩되어야 함.
- [에이전트 개발 원칙 19] **대칭성 무결성(Symmetry Integrity)**: 검색창-홈 화면, 그룹-비그룹 등 시각적으로 대칭되어야 하는 구간의 디자인/규격(Label, Size, Width 등)이 단 1px의 오차도 없이 일치하는지 최종 보고 전 체크리스트로 검증할 것.
"""

if os.path.exists(gemini_path):
    with open(gemini_path, "a", encoding="utf-8") as f:
        f.write(new_rules)
    print("GEMINI.md 전역 지침 보강 완료.")
else:
    print("GEMINI.md 파일을 찾을 수 없습니다.")
