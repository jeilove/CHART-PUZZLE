import os

def update_global_debug_history():
    history_path = r'C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md'
    
    new_entry = """
## [DONE] 2026-04-10 - 스탁 차트 퍼즐: 로컬 백업/복원 모듈화 및 설정 UI 구현

### 현상
- 즐겨찾기 데이터를 로컬로 안전하게 보관하고 복구하는 기능이 누락되었거나 가시성이 떨어짐.
- `page.tsx` 한 파일에 모든 비즈니스 로직이 섞여 있어 유지보수가 어려움.

### 해결
- **모듈화(Modularization)**: `src/lib/hooks/useLocalBackup.ts` 커스텀 훅을 신설하여 데이터 내보내기/불러오기 로직을 100% 분리함 (원칙 26 준수).
- **설정 메뉴 구현**: 하단 탭바에 설정 전용 아이콘을 배치하고, 프리미엄 글래스모피즘 디자인의 설정 모달을 통해 백업 기능을 제공함.
- **버전 관리**: 최종 안정 버전을 `v2.10.53`으로 명시하고 콘솔 및 UI에 반영함.

### 교훈
- 단순 기능 추가보다 독립된 훅(Hook)으로 로직을 분리하는 것이 다른 프로젝트에서의 재사용성과 코드 가독성을 비약적으로 향상시킴.

### 태그
- #모듈화 #ReactHooks #로컬백업 #NextJS #데이터관리
"""

    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error updating GLOBAL_DEBUG_HISTORY.md: {e}")

if __name__ == "__main__":
    update_global_debug_history()
