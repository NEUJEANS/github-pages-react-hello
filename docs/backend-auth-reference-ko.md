# HAVENLY 백엔드 인증 참고 자료 (Node 기준)

## 현재 백엔드 언어 판단
- Spring 아님
- 현재 코드 기준 백엔드는 Node.js 계열
- 근거 파일:
  - `server/auth-http-server.js`
  - `server/auth-persistent-store.js`

## 우선 참고할 자료

### 1. Express Security Best Practices (공식)
- URL: https://expressjs.com/en/advanced/best-practice-security.html
- 왜 보나:
  - TLS
  - user input 검증
  - secure cookie
  - brute-force 방어
  - dependency security
- 이번 프로젝트 관련 포인트:
  - 인증 라우트 보안 기본값 정리
  - production 쿠키 옵션 점검

### 2. Express CORS Middleware (공식)
- URL: https://expressjs.com/en/resources/middleware/cors.html
- 왜 보나:
  - `credentials: true`
  - `origin` 명시
  - preflight 처리
- 이번 프로젝트 관련 포인트:
  - 프론트/백엔드 분리 시 로그인/회원가입 요청 허용 규칙 정리

### 3. SuperTokens - Node/Express Auth Guide
- URL: https://supertokens.com/blog/user-authentication-in-node
- 왜 보나:
  - 회원가입
  - 로그인
  - 세션 관리
  - 보호 라우트 흐름
- 이번 프로젝트 관련 포인트:
  - auth flow를 한 번 깔끔하게 재설계할 때 참고 가치 높음

## 스타 많거나 신호 강한 라이브러리/레퍼런스 후보

### Passport.js
- GitHub: https://github.com/jaredhanson/passport
- 용도:
  - 다양한 인증 전략
  - 전통적인 Node 인증 패턴 참고

### Better Auth
- GitHub: https://github.com/better-auth/better-auth
- 용도:
  - 요즘식 auth 구조 참고
  - 단, 현재 프로젝트에 바로 도입할지는 별도 판단 필요

### SuperTokens
- GitHub: https://github.com/supertokens/supertokens-core
- 용도:
  - 세션/인증 구조 참고
  - 완전 도입보다 설계 패턴 참고 가치가 큼

## 지금 설치/적용한 스킬
- `skills/nodejs-patterns`
- `skills/secure-auth-patterns`
- `skills/context7-mcp-skill`

## 현재 MCP 상태
- 사용 가능:
  - `playwright`
  - `deepwiki`
- 아직 백엔드 전용 MCP를 따로 안정적으로 붙인 상태는 아님
- 대신 Context7 계열은 문서 조회용으로 추가 검토 가능

## 실무 적용 우선순위
1. Express 공식 security 문서로 기본 보안 원칙 정리
2. Express CORS 공식 문서로 프론트-백엔드 요청 규칙 정리
3. SuperTokens/Passport/Better Auth는 구조 참고용으로 제한 사용
4. 현재 HAVENLY에는 과도한 auth 프레임워크 도입보다, 로그인/회원가입 최소 경로를 먼저 안정화
