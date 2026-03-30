import os

target_file = r"C:\Users\ACECOM\.gemini\GEMINI.md"

new_rule = """
- [에이전트 디버깅 원칙 13] **GEMINI.md 수정 지침**: `C:\\Users\\ACECOM\\.gemini\\GEMINI.md` 파일을 직접 수정하려고 하면 무한 로딩이 발생할 수 있습니다. 수 정이 필요한 경우, 반드시 프로젝트 루트에 `update_gemini_global.py`와 같은 파이썬 스크립트를 작성하여 간접적으로 파일을 업데이트하도록 합니다.
"""

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

if "[에이전트 디버깅 원칙 13]" not in content:
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(new_rule)
    print("SUCCESS: Rule 13 added via script.")
else:
    print("SUCCESS: Rule 13 already exists.")
