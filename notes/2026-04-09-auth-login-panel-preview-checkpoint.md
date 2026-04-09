# 2026-04-09 — auth login panel preview checkpoint

## What changed
- added `buildAuthLoginPanelState()` so the non-guard login modal can derive the same structured initial-login payload contract that the guarded flow already used
- replaced the plain-text non-guard request preview in `src/main.jsx` with a compact `로그인 요청 payload 미리보기` card that surfaces the canonical endpoint, payload keys, and `draftSave` counts before submit
- extended `auth-session-view-state.test.js` to lock the non-guard login payload preview shape to the current frontend→backend auth contract
- updated `scripts/auth-login-smoke.mjs` to read and assert that direct-login browser flows expose the same first-hop payload preview contract before submitting credentials

## Why this matters for auth priority
The guarded login flow already showed the first auth request clearly, but the plain login modal still described it with ad-hoc copy. Reusing the same structured preview keeps the initial login path aligned with the serializable draft/save handoff and the backend scaffold contract, which is exactly the auth-first slice this branch is trying to tighten.

## Validation
- `npm test -- src/components/auth-session-view-state.test.js`
- `node --check scripts/auth-login-smoke.mjs`
- `npm run smoke:auth` ⚠️ completed through HTTP fallback and confirmed scaffold auth paths, but the browser leg still timed out reopening the modal heading (`getByRole('heading', { name: /로그인/ })`)
- attempted `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini -- --files src/components/auth-session-view-state.js src/components/auth-session-view-state.test.js src/main.jsx scripts/auth-login-smoke.mjs`; Gemini started and wrote a review file, but the wrapper still appears noisy/stalled in this environment

## Next auth-first step
- debug why the browser smoke occasionally fails to re-open the login heading even though the HTTP scaffold path succeeds, then keep asserting the visible first-hop login contract in the real browser flow
- once that is stable, mirror the same preview contract into any remaining resumed-login/bootstrap entry points so the frontend always exposes the backend auth handoff it is about to use
