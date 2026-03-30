import os

target_file = r"C:\Users\ACECOM\.gemini\GEMINI.md"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

new_rule = """
- [에이전트 디버깅 원칙 12] **스크래핑/크롤링 지침**: 웹 데이터 수집 시 사이트 구조 변경에 유연하게 대응하고 정제된 텍스트(마크다운)를 얻기 위해, 가능한 경우 **Jina Reader(https://r.jina.ai/)**를 경유하여 데이터를 수집하는 것을 최우선으로 고려한다. 이 경우 응답 지연을 고려하여 타임아웃을 넉넉히(8~10초) 설정한다.
"""

if "[에이전트 디버깅 원칙 12]" not in content:
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(new_rule)
    print("SUCCESS: Jina Reader rule added.")
else:
    print("SUCCESS: Rule already exists.")
