import os

def update_history():
    path = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"
    new_entry = """
---

## 🛑 [공통] fetch URL 쿼리 파라미터 문자열 조합 오류 (404 Not Found)
- **현상**: 트리거 분석(Trigger Pulse) 등 화면 진입 시 `HTTP Error: 404` 발생.
- **원인**: `fetch(\`/api/...?param1=val1&param2=val2\`)` 형태의 문자열 조합 시, 조건부 파라미터 삽입 로직 오류(예: 첫 번째 파라미터에 `?` 대신 `&` 사용 또는 그 반대)로 인해 유효하지 않은 URL 경로가 생성됨. Next.js 서버에서 해당 경로를 찾지 못해 404를 반환함.
- **해결책**:
  1. **쿼리 스트링 규칙 준수**: 첫 번째 파라미터는 `?`로 시작하고, 이후 파라미터는 `&`로 연결하는 규칙을 철저히 확인.
  2. **URLSearchParams 권장**: 복잡한 조합 시 `new URLSearchParams()`를 사용하거나, 템플릿 리터럴 내에서 `?t=Time`을 항상 먼저 배치하여 이후 조건부 파라미터가 항상 `&`로 시작되도록 구조화함.
  **태그**: #에이전트실수 #URL조합오류 #404NotFound
"""
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(new_entry)
        print("Successfully updated GLOBAL_DEBUG_HISTORY.md")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_history()
