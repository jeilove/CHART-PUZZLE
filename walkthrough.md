# Walkthrough: Google 로그인 및 DB 동기화 설정 가이드

본 프로젝트는 이제 사용자가 개인화된 즐겨찾기 데이터를 여러 기기에서 동기화할 수 있도록 지원합니다. 아래 단계를 따라 설정을 완료해 주세요.

## 1. 환경 변수 설정
프로젝트 루트(`frontend/`)에 `.env.local` 파일을 생성하고 아래 내용을 입력해 주세요. (무한 루프 문제로 인해 에이전트가 직접 생성하지 못했습니다.)

```env
# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=여러분의_구글_클라이언트_ID
GOOGLE_CLIENT_SECRET=여러분의_구글_클라이언트_시크릿

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=원하시는_아무_랜덤_문자열

# DB 연결 (Neon.tech 추천)
DATABASE_URL="postgresql://user:password@hostname:port/dbname?sslmode=require"
```

## 2. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. 'API 및 서비스' > '사용자 인증 정보'로 이동합니다.
4. '사용자 인증 정보 만들기' > 'OAuth 클라이언트 ID'를 선택합니다.
5. 승인된 리디렉션 URI에 아래 주소를 추가합니다:
   - [로컬용]: `http://localhost:3000/api/auth/callback/google`
   - [Vercel용]: `https://chart-puzzle.vercel.app/api/auth/callback/google`
6. 생성된 Client ID와 Secret을 `.env.local` 및 Vercel 환경변수에 복사합니다.

## 3. DB 스키마 동기화 (Prisma)
터미널(frontend 폴더)에서 아래 명령어를 실행하여 Neon DB에 테이블을 생성합니다.
```bash
pnpm prisma db push
```

## 4. 실행 및 테스트
## 5. 자주 묻는 질문 및 트러블슈팅
- **즐겨찾기 목록이 사라졌어요**: 
  - 최근 v2.10.28 업데이트에서 동기화 가드(`isFavoritesLoaded`)가 추가되었습니다. 비정상적으로 빈 화면이 보인다면 강력 새로고침(`Ctrl + F5`)을 진행해 주세요.
  - 로그인이 풀린 경우, 관리자 추천 종목이 기본적으로 표시됩니다. 다시 로그인하면 본인의 데이터로 동기화됩니다.
- **데이터가 실시간 반영되지 않아요**: 
  - 모바일과 PC를 동시에 사용할 경우, 약 10분의 데이터 캐시 주기가 있습니다. 즉시 반영을 원하면 페이지를 새로고침해 주세요.
- **즐겨찾기 추가 시 응답이 없어요**: 
  - 네트워크 연결 상태를 확인해 주세요. 오프라인 상태에서 추가한 데이터는 로컬스토리지에 임시 저장되었다가 온라인 전환 시 DB와 동기화됩니다.
