
import os

entry = """
---

## [DONE] 2026-04-09 - 즐겨찾기 그룹 변경 편의성 개선 (Stock Chart Puzzle)

### 현상
- 즐겨찾기(별표)를 해제한 뒤 다시 등록할 때, 이전 위치(그룹 또는 미분류)로 자동 복구되는 기능 때문에 종목의 소속 그룹을 변경하려면 드로어를 통해 수동으로 이동시켜야 하는 번거로움이 있었음.

### 원인
- `smartToggleFavorite` 함수 내에 '스마트 복구' 로직이 포함되어 있어, 최근 삭제된 종목의 경우 저장된 이전 위치를 우선적으로 적용하기 때문임.

### 해결
- **로직 전환**: '스마트 복구' 대신 항상 **그룹 선택 메뉴(Drawer/Bottom Sheet)**가 나타나도록 수정함.
- **사용자 편의성**: `lastRemovedFavoriteLocation` 정보를 활용하여 이전 그룹이 메뉴에서 기본 선택되어 있도록 설정하여, 변경을 원치 않을 경우 즉시 완료할 수 있도록 하면서도 변경의 기회를 명시적으로 제공함.
- **버전 업데이트**: `v2.10.51`로 상향하여 변경 사항을 콘솔과 푸터에서 확인할 수 있도록 함.

### 교훈
- **편의 기능과 제어권의 균형**: AI가 판단하는 '스마트한 자동화'가 때로는 사용자의 수정 의지를 방해할 수 있음. 사용자 경험 설계 시 '자동 복구'보다는 '선택권 부여'가 더 유연한 가치를 제공할 수 있음을 확인.

### 태그
- #즐겨찾기개선 #그룹변경 #UX고도화 #v2.10.51 #성공

---
"""

target_path = r'C:/Users/ACECOM/.gemini/GLOBAL_DEBUG_HISTORY.md'
with open(target_path, 'a', encoding='utf-8') as f:
    f.write(entry)
print("Successfully appended to GLOBAL_DEBUG_HISTORY.md")
