import os
path = r'e:\바이브코딩\Stock Chart Puzzle\CHANGELOG.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    orig = f.read()

new_entry = """
## [2026-04-01] - 검색 엔진 고도화 및 리포트 가시성 개선 (v0.8.5)
### ✅ 완료된 작업 (Completed)
- **전 종목 업중 통합 검색 강화**:
  - 기존 30개에서 **50개**로 검색 결과 노출 범위를 상향 조정.
  - 검색어와 업종/종목명의 모든 **공백을 제거한 후 비교**(`replace(" ", "")`)하도록 로직을 강화하여 검색 정확도 대폭 향상.
- **트리거 분석 리포트 날짜 개수 제한**:
  - 사용자 요청에 따라 트리거 정보 확인 시 표시되는 리포트 날짜를 최근 **3개**로 제한 (기존 10개).
  - 백엔드(`scraper.py`)와 프론트엔드(`PuzzleGame.tsx`) 두 레이어 모두에 제한 적용.
- **검색 UX 개선**:
  - 프론트엔드 검색 결과 표시 개수를 12개에서 **40개**로 확대.
  - 검색 중 **로딩 인디케이터(Loader2)**를 추가하여 대량 데이터 검색 시 피드백 제공.
  - 검색어 입력 시 300ms **디바운스(Debounce)** 적용으로 불필요한 API 요청 및 깜빡임 최소화.
"""

target_h1 = '# 📜 프로젝트 기록 (CHANGELOG)'
if target_h1 in orig:
    content = orig.replace(target_h1, target_h1 + "\n" + new_entry)
else:
    content = target_h1 + "\n" + new_entry + "\n" + orig

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("CHANGELOG.md updated.")
