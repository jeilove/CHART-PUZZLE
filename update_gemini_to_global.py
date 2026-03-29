import os

target_file = r"C:\Users\ACECOM\.gemini\GEMINI.md"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

old_section = """### 디버그 이력 문서에 기록
코드의 오류수정/보완, 디버그 작업할 때는 항상 디버그 이력 문서(degug_history.md)를 만들어 사용자가 수정 요청하면 즉시 문서에 수정 항목별로 체크박스 형태로 기록하고 디버깅 작업을 하면서 완료된 것들을 채크하면서 진행한다.
수정이 완료된 후에는 수정 내용들의 원인을 케이스별로 태그를 넣어 기록한다. (예: 에이전트실수, 버전문제,디자인 보완, 텍스트수정, 성능향상 등) 
코드 오류 수정 작업을 할때는 항상 degug_history.md 문서를 보고 진행 상황/내용을 파악한다."""

new_section = """### 글로벌 디버그 히스토리 운영 (필수)
모든 디버깅 작업(오류 수정, 보완 등)은 개별 프로젝트 내부가 아닌, 반드시 `C:/Users/ACECOM/.gemini/GLOBAL_DEBUG_HISTORY.md` 파일에 기록한다.
사용자의 수정 요청 시 즉시 글로벌 문서에 체크박스 형태로 기록하고, 작업 완료 후에는 원인별 태그(예: 에이전트실수, 버전문제, 디자인보완 등)와 함께 진행 상황을 최신화한다.
모든 에이전트는 작업 전 반드시 이 글로벌 문서를 열람하여 동일한 오류가 발생하지 않도록 한다. (개별 프로젝트의 debug_history.md 생성은 지양한다.)"""

if old_section in content:
    new_content = content.replace(old_section, new_section)
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Debug history instruction updated to Global.")
else:
    # Try a more flexible match if exact match fails
    print("FAILED: Exact section not found for replacement.")
