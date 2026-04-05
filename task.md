# Task: 개인화 서비스를 위한 Auth.js 및 DB 동기화 구현

## 진행 상황
- [x] NextAuth.js (Auth.js) v4 설정 및 Google Provider 연동
- [x] Prisma Adapter를 통한 Neon DB(PostgreSQL) 연동 준비
- [x] 개인 즐겨찾기(Favorites) DB 동기화 API 구현 (`/api/user/sync`)
- [x] 프론트엔드 로그인/로그아웃 UI 구현 및 세션 상태에 따른 데이터 동기화 로직 추가
- [x] TypeScript 타입 오류 해결
- [x] Vercel 배포 시 Prisma Client 생성 오류 해결 (build 스크립트 수정)

## 남은 작업 (사용자 직접 세팅 필요)
- [ ] Google Cloud Console: Client ID, Secret 생성 및 입력
- [ ] Neon/Supabase: DB 생성 및 연결 문자열 입력
- [ ] Prisma: `pnpm prisma db push` 실행하여 DB 스키마 동기화
- [ ] `.env.local` 파일 구성

## 작업 완료 보고
모든 소스코드 레벨의 구현은 완료되었습니다. 사용자가 로컬 환경에서 직접 API 키와 DB 주소를 입력한 후 DB 스키마를 푸시하면 연동이 즉시 시작됩니다.
