# Task: v1.5.4 350종목 완전체 분석 재가동

## 진행 상황
- [x] 서버리스 환경 및 종목 수 정합성 확인 (KOSPI 200 + KOSDAQ 150 = 350)
- [x] `scraper.py` 고도화 (v1.5.4): 시계열 가중치(Exponential Decay) 로직 및 전수 조사 엔진 탑재
- [x] `batch_analyze.py` 업데이트- [x] v1.5.4 350종목 전수 분석 및 데이터 동기화 
- [x] 트리거 클라우드/타임라인 시각화 고도화 (정규화 로직 적용)
- [x] 차트 레이아웃 겹침 해결 (60px 마진 확보)
- [ ] 검색 메뉴 및 히트맵 상세 보완 (내일 예정)

## 상세 작업 내역
### 1. scraper.py 업데이트
- 시계열 가중치 수식: $e^{-\lambda \cdot \Delta t}$ 적용 (최근 리포트 중요도 강화)
- 모든 리포트 텍스트 전수 분석 로직 강화

### 2. batch_analyze.py 업데이트
- 350개 종목 전수 조사 프로세스 안정화
- 무한 루프 방지를 위한 타임아웃 및 예외 처리 강화

### 3. 결과물
- `trigger_report.json`: 상위 20 종목 (Positive, Negative, Change, Trend)
