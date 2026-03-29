import os

target_file = r"C:\Users\ACECOM\.gemini\GLOBAL_DEBUG_HISTORY.md"

new_lessons = """
## 🔄 데이터 동기화 및 캐시 이슈
- **증상**: 로컬 데이터를 복구하거나 파일을 수정해도 화면이 이전 상태로 되돌아가거나 변화가 없음.
- **원인 1 (파일명 캐싱)**: 브라우저와 Next.js가 특정 파일명(예: q4.png)을 캐싱하여 물리적 파일을 고쳐도 이전 데이터를 계속 보여줌.
- **해결책 1**: 파일명을 강제로 변경(예: q4_v2.png)하여 캐시를 무력화(Cache Busting).
- **원인 2 (동기화 우선순위)**: 로컬 복구 직후 백그라운드 동기화 로직이 서버의 구형 데이터를 '최신'으로 오판하여 로컬을 덮어씌움.
- **해결책 2**: 데이터 복구 즉시 서버 DB를 강제 갱신(Push)하는 서버 액션을 실행하여 정합성 확보.

## 🔐 인증 및 미들웨어(Edge Runtime) 이슈
- **증상**: NextAuth 연동 시 미들웨어에서 DB 관련 Node.js API 호출 에러 발생.
- **원인**: Next.js Middleware는 Edge Runtime에서 실행되므로 Node.js 전용 DB 어댑터나 모듈을 직접 호출할 수 없음.
- **해결책**: `auth.config.ts`를 생성하여 DB와 무관한 공통 설정만 담고, 미들웨어는 이를 참조하게 하여 서버 사이드(`auth.ts`)와 역할을 분리함.

## 🚀 배포 및 환경 변수 이슈
- **증상**: 온라인(Vercel) 배포 후 `/api/auth/session` 500 에러 또는 인증 실패.
- **원인**: `AUTH_SECRET`, `AUTH_GOOGLE_ID` 등 필수 환경 변수 누락 또는 `trustHost` 설정 부재.
- **해결책**: Vercel 대시보드에 환경 변수를 전수 등록하고, `auth.ts`에 `trustHost: true` 및 JWT 콜백 정합성을 확인.

## 🧩 하이드레이션 및 DOM 구조 이슈
- **증상**: Next.js에서 `Hydration failed` 에러 발생.
- **원인**: HTML 표준에 위배되는 중첩 구조(예: `<p>` 태그 안에 `<div>`가 들어가는 경우) 사용.
- **해결책**: 중첩된 `<div>`를 보존하려면 부모 태그를 `<div>`로 변경하거나 구조를 분리하여 HTML5 표준 준수.
"""

with open(target_file, "a", encoding="utf-8") as f:
    f.write(new_lessons)

print("SUCCESS: Legacy lessons migrated to Global Debug History.")
