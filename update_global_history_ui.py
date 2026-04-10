import os

def update_global_debug_history():
    history_path = r'C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md'
    
    new_entry = """
## [DONE] 2026-04-10 - 아이디어 대시보드 하단 탭바 및 설정 모달 UI 구현

### 현상
- 사이드바 기반의 백업 UI가 직관적이지 않고 찾기 어려움 (사용자 피드백: "사이브바가 어딨어?").

### 해결
- **UX 개선**: '차트 퍼즐' 프로젝트의 성공적인 패턴인 **하단 고정 네비게이션 탭바**를 도입함.
- **Settings Modal**: 설정 아이콘을 통해 별도의 프리미엄 모달을 띄워 백업/복구 기능을 제공하도록 구조 변경.
- **디자인 일관성**: 다크 모드와 유리창 효과(Glassmorphism)를 적용하여 전체적인 디자인 완성도 강화.

### 교훈
- 사용자에게 익숙한 UI 패턴(하단 탭바)을 적용하는 것이 기능의 가시성을 높이는 데 결정적인 역할을 함.

### 태그
- #UX개선 #하단탭바 #설정모달 #유리창효과 #Svelte5
"""

    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error updating GLOBAL_DEBUG_HISTORY.md: {e}")

if __name__ == "__main__":
    update_global_debug_history()
