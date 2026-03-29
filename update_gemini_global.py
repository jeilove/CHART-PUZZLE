import os

target_file = r"C:\Users\ACECOM\.gemini\GEMINI.md"

with open(target_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Insert the global reference notice at the beginning (after the line 1 and some metadata maybe)
# Or just after the first header.

new_notice = """
### 글로벌 디버그 히스토리 참조 (필수)
모든 에이전트는 새로운 프로젝트를 시작하거나 비정상적인 에러 발생 시, `C:/Users/ACECOM/.gemini/GLOBAL_DEBUG_HISTORY.md`에 기록된 공통 '삽질' 사례들을 우선적으로 검토하여 중복된 오류 수정을 방지한다.
"""

# Check if it already exists to avoid duplication
full_content = "".join(lines)
if "GLOBAL_DEBUG_HISTORY.md`에 기록된" not in full_content:
    # Insert after the first few lines
    lines.insert(4, new_notice)
    
    with open(target_file, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("SUCCESS: Global reference notice added successfully.")
else:
    print("SUCCESS: Notice already exists.")
