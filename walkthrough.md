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
   - `http://localhost:3000/api/auth/callback/google`
6. 생성된 Client ID와 Secret을 `.env.local`에 복사합니다.

## 3. DB 스키마 동기화 (Prisma)
터미널(frontend 폴더)에서 아래 명령어를 실행하여 Neon DB에 테이블을 생성합니다.
```bash
pnpm prisma db push
```

## 4. 실행 및 테스트
`run_dev.bat`을 실행하고 홈 화면 상단 우측의 로그인 버튼을 클릭하여 구글 로그인을 진행해 보세요. 로그인 후 즐겨찾기를 추가하면 DB에 실시간으로 저장됩니다.
