import os

def update_global_debug_history():
    history_path = r'C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md'
    
    new_entry = """
## [DONE] 2026-04-10 - 글로벌 지침(GEMINI.md)에 모듈화 및 문서화 규칙 추가

### 현상
- 다른 프로젝트에서 에이전트가 소스를 재사용할 때, 이전 버전과 섞여 있거나 핵심 로직(백업/복구 등)을 찾기 어려워하는 문제가 발생함.

### 해결
- 글로벌 지침(GEMINI.md)에 **[에이전트 개발 원칙 26]**을 추가하여 핵심 로직의 **모듈화(hooks, utils 등)**와 **명시적 문서화(버전 및 기능 설명)**를 의무화함.

### 교훈
- 소스 코드에 '최종 버전'임을 주석으로 명시하고 로직을 분리하는 것만으로도 에이전트의 코드 이해도와 재사용성을 비약적으로 높일 수 있음.

### 태그
- #에이전트지침 #모듈화 #문서화 #코드재사용
"""

    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error updating GLOBAL_DEBUG_HISTORY.md: {e}")

if __name__ == "__main__":
    update_global_debug_history()
