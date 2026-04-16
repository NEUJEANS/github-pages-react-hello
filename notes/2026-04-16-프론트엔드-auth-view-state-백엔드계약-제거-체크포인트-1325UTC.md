# 2026-04-16 프론트엔드 auth view-state 백엔드계약 제거 체크포인트 (1325 UTC)

## 이번 슬라이스 목표
현재 프론트엔드 auth-entry 흐름과 화면은 유지한 채, `auth-session-view-state`에 남아 있던 backend-oriented 계약(connection/payload preview/transport 메타데이터)을 제거해 React UI 상태를 더 얇게 만든다.

## 이번에 한 일
- `src/components/auth-session-view-state.js`
  - 로그인/가드/ready/resume 패널 상태에서 UI가 실제로 쓰지 않던 아래 필드를 제거했다.
    - `connectionLabel`
    - `connectionEndpoint`
    - `connectionSource`
    - `connectionCredentialsMode`
    - `submitPayloadPreview`
    - `actionPayloadPreview`
  - 위 dead contract를 만들던 helper도 함께 제거했다.
    - submit payload preview builder
    - action payload preview builder
    - continuation connection selector 성격 helper
  - 남긴 계약은 실제 사용자-facing auth UI가 쓰는 정보만으로 축소했다.
    - 제목/부제
    - 복원 요약
    - draft context bits
    - draft save bits
    - intent label
    - continuation 상태
    - primary CTA copy
    - action checklist
- `src/components/auth-session-view-state.test.js`
  - 대규모 backend payload/connection snapshot 검증을 없애고, customer-facing contract 중심 테스트로 재작성했다.
  - 남은 검증 초점
    - 로그인/가드/ready/resume 패널이 필요한 문구만 만든다
    - merge resolution CTA copy가 유지된다
    - blocker copy에 technical/debug/backend 문구가 섞이지 않는다
    - session notice 문구가 기존 사용자 의미를 유지한다
- `src/components/auth-modal.jsx`
  - modal prop 계약에서 `authConnectionSummary`를 제거했다.
  - guard/login panel builder 호출도 transport metadata 없이 user-facing summary만 넘기도록 정리했다.
- `src/app-shell.jsx`
  - `LoginModal`에 더 이상 쓰지 않는 `authConnectionSummary` prop 전달을 제거했다.
  - `buildAuthReadyPanelState` / `buildAuthResumePanelState` 호출에서 더 이상 필요 없는 `actionConnection` 전달도 제거해 auth UI 계산 경계를 조금 더 얇게 했다.

## 의도적으로 하지 않은 일
- backend auth 복구
- `/api/auth/*` 엔드포인트 대수술
- auth storage shape 변경
- live tunnel / cookie / CORS / auth server 재검증
- `app-shell.jsx` 대규모 분해

## 검증
- narrow test
  - `node --test src/components/auth-session-view-state.test.js`
  - 결과: pass 10 / fail 0
- frontend build
  - `npm run build`
  - 결과: 성공

## diff 성격
- 이번 슬라이스는 UI 변경보다 계약 축소 중심이다.
- `auth-session-view-state.js` / test에서 삭제 비중이 크고, 현재 화면 표면은 그대로 유지한다.

## 현재 판단
- auth modal / notice / ready-resume 패널에서 실제 사용하지 않는 backend-oriented 상태가 빠지면서 React-level auth view state가 더 명확해졌다.
- 프론트엔드-only auth-entry 구조를 유지하면서, 나중에 더 나은 backend를 붙일 때도 UI state와 transport state를 분리하기 쉬운 방향이다.
- 다음 단계는 이 축소된 계약을 기준으로 `app-shell.jsx`의 auth 관련 계산/조립부를 hook 또는 page-level 경계로 더 떼어내는 쪽이 가장 자연스럽다.

## 다음 직접 단계
1. `app-shell.jsx`에서 auth 전용 계산 블록(`authReadyPanelState`, `authResumePanelState`, bootstrap 주변 계산)을 hook 또는 별도 auth-shell module로 분리한다.
2. `auth-config` / `auth-submit` / verification helper에 남아 있는 backend-shaped naming을 frontend scaffold naming으로 점진 치환한다.
3. apartment selection/search 잔존 상태가 실제 화면에 더 이상 필요 없는지 재점검하고, auth continuity에 불필요한 흔적이면 후속 슬라이스에서 제거한다.
