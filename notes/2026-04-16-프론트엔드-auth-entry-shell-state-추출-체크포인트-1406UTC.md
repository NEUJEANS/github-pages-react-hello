# 2026-04-16 프론트엔드 auth-entry shell state 추출 체크포인트 (1406 UTC)

## 이번 슬라이스 목표
현재 프론트엔드 auth-entry UI 표면은 그대로 두고, `app-shell.jsx` 안에 붙어 있던 auth 전용 form/session helper를 별도 모듈로 옮겨 다음 단계의 auth-shell 분리를 쉽게 만든다.

## 이번에 한 일
- `src/components/auth-entry-shell-state.js` 추가
  - `buildAuthContinuationFieldState`
  - `pickPersistedAuthContinuationFields`
  - `buildEmptyLoginForm`
  - `buildAuthSessionResultSummary`
  - 위 4개를 `app-shell.jsx` 밖의 frontend-only auth helper 모듈로 추출했다.
- `src/app-shell.jsx`
  - 위 helper들을 새 모듈 import로 전환했다.
  - 상단에 박혀 있던 local helper 정의를 제거했다.
  - 더 이상 쓰이지 않던 `resolveLoginButtonLabel` / `resolveAccountTriggerAriaLabel` dead helper도 함께 제거했다.
- `src/components/auth-entry-shell-state.test.js` 추가
  - continuation field 기본값
  - blocker action에서만 persisted continuation fields 유지
  - empty login form 기본 contract
  - auth-ready session summary contract
  - 위 4개를 좁은 단위 테스트로 고정했다.

## 왜 이 슬라이스가 지금 맞는가
- UI를 바꾸지 않고도 `app-shell.jsx`의 auth-entry 전용 책임을 줄였다.
- 다음 단계에서 bootstrap / submit / resume handler를 hook 또는 auth-shell module로 더 떼어낼 때, 이미 helper contract가 외부 파일로 분리돼 있어 diff가 작아진다.
- backend 복구나 live auth 검증으로 흐르지 않고, 현재 프론트엔드 구조 정리에만 집중할 수 있다.

## 의도적으로 하지 않은 일
- auth backend 복구
- `/api/auth/*` naming 대수술
- layout/auth continuity storage shape 변경
- apartment board context 제거
- push / deploy / tunnel 검증

## 검증
- narrow tests
  - `node --test src/components/auth-entry-shell-state.test.js src/components/auth-session-view-state.test.js`
  - 결과: pass 14 / fail 0
- frontend build
  - `npm run build`
  - 결과: 성공

## 현재 판단
- 이번 변경은 사용자-facing auth modal/notice surface를 건드리지 않고 `app-shell.jsx`를 더 얇게 만든 안전한 중간 단계다.
- 다음 직접 가치가 큰 슬라이스는 여전히 `app-shell.jsx`의 auth bootstrap / submit / resume 조립부를 hook 또는 auth-shell module로 옮기는 일이다.
- auth가 아직 frontend scaffold이긴 하지만, 적어도 shell 내부 책임은 backend-oriented 조립에서 page/auth module 경계 쪽으로 한 단계 이동했다.

## 다음 직접 단계
1. `app-shell.jsx`의 auth bootstrap / pending restore / ready-resume 계산 블록을 `use-auth-entry-flow` 같은 hook으로 분리한다.
2. 그 다음 `auth-config` / `auth-submit`에 남아 있는 backend-shaped naming을 frontend scaffold naming으로 점진 치환한다.
3. 후속 슬라이스에서 apartment selection/search 맥락이 auth continuity에 꼭 필요한지 다시 점검하고, 불필요하면 generic board context로 축소한다.
