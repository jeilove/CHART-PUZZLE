import os

def update_global_debug_history():
    history_path = r'C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md'
    
    new_entry = """
## [DONE] 2026-04-10 - 아이디어 대시보드 로컬 백업/복구 구현 (원칙 26 적용)

### 현상
- '차트 퍼즐'에 있던 백업 기능을 '아이디어 대시보드'에도 이식해야 함. 단순 복제가 아닌 모듈화된 방식으로 구현 필요.

### 해결
- **Modularization**: 백업 로직을 `src/lib/utils/backup.ts`로 분리하여 Svelte 5 환경에 맞게 재작성함.
- **Explicit Documentation**: 파일 상단에 `@version`, `@feature`, `@description`을 명시하여 에이전트가 쉽게 인지하도록 함.
- **UI Integration**: 사이드바 하단에 '데이터 관리' 섹션을 추가하여 직관적인 백업/복원 버튼(Lucide-svelte) 배치.

### 교훈
- 새로 정립한 **[원칙 26]**에 따라 로직을 분리하니, 기존 `+page.svelte`가 비대해지는 것을 막고 다른 프로젝트로의 이식성이 극대화됨.

### 태그
- #모듈화 #백업구현 #Svelte5 #원칙26준수
"""

    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error updating GLOBAL_DEBUG_HISTORY.md: {e}")

if __name__ == "__main__":
    update_global_debug_history()
