import os

def update_history():
    path = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"
    new_entry = """
---

## 🛑 [치명적] 즐겨찾기 데이터 소실 및 DB 동기화 가드 누락 (v2.10.28)
- **현상**: 1D 그래프 또는 데이터 갱신 중 참조 오류(ReferenceError 등) 발생 시 React 상태가 초기값(빈 배열 [])으로 리셋됨. 이때 DB sync 전용 `useEffect`가 실행되어 빈 배열을 DB에 POST함으로써 사용자의 모든 즐겨찾기 데이터가 삭제(Overwrite)됨.
- **원인**: 
  1. **로딩 가드 부재**: 데이터 로딩이 완료되었는지 확인하는 상태(`isFavoritesLoaded`) 없이 `useEffect`가 동작함.
  2. **빈 상태 Push**: `favoriteGroups.length === 0`인 상태를 '삭제'가 아닌 '초기 상태'로 오인하여 DB에 반영함.
- **해결책 (절대 원칙)**: 
  1. **로딩 가드 필수**: `isFavoritesLoaded`와 같은 명시적 플래그가 `true`일 때만 DB 쓰기(POST/PUT)를 허용함.
  2. **빈 상태 보호**: `favoriteGroups`와 `ungroupedStocks`가 모두 비어있을 경우, 의도적인 전체 삭제가 아닌 한 DB Sync를 중단함.
  3. **API Fallback**: DB가 비어있거나 관리자 데이터 로드 실패 시, 사용자에게 빈 화면을 보여주지 않도록 `STOCK_LIST` 기반의 하드코딩 Fallback 데이터를 반환함.
  **태그**: #에이전트실수 #데이터소실 #DBSync #로딩가드 #v2.10.28
"""
    try:
        # 인코딩 문제 방지를 위해 utf-8로 읽고 쓰기
        with open(path, "a", encoding="utf-8") as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md with v2.10.28 case.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_history()
