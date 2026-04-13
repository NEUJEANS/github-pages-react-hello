# 2026-04-08 auth action-required smoke checkpoint

## What changed
- extended `scripts/auth-login-smoke.mjs` so auth smoke output now covers the backend-scaffold action-required login contracts in addition to the existing direct success, save-layout-draft, and guarded merge paths
- added HTTP smoke snapshots for `complete-profile` and `verify-email`, preserving the same serialized handoff / connection metadata that the login flow already emits
- updated the browser smoke path to look for the current ready-panel CTA labels (`게스트 초안 이어가기`, `프로필 보완 계약 보기`, `이메일 인증 계약 보기`) and capture the action-required checklist plus disabled CTA state when Playwright is available
- hardened `vite.config.js` request-body collection so the preview/dev auth scaffold middleware can safely normalize non-Buffer request chunks before JSON parsing

## Validation
- `node --check scripts/auth-login-smoke.mjs` ✅
- `npm test` ✅
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/` ✅ for the script run itself; existing same-origin scaffold success/save-draft/merge flows still pass and the new action-required cases now show up explicitly in the smoke JSON

## Current auth-focused finding
- the new HTTP smoke coverage exposed a remaining preview/dev auth-scaffold mismatch: the action-required credentials (`profile@example.com`, `verify@example.com`) currently come back as `400 Invalid auth scaffold request` through the Vite middleware even though the pure scaffold helper supports those intents in unit tests
- that means the frontend contract coverage is now in place, but the next auth slice should debug the preview middleware path so `complete-profile` / `verify-email` can bootstrap the same way the save-draft and merge scaffolds already do

## Why this matters
- this keeps the work focused on login/auth flow development rather than general cleanup
- the smoke harness now watches one of the exact backend-shaped gaps we care about next: authenticated-but-blocked sessions that should keep the modal open with serialized resume metadata
- once the middleware mismatch is fixed, the same smoke path can immediately confirm the frontend ready panel is truly wired to those backend action-required scaffold states

## Next smallest checkpoint
1. debug why preview/dev `POST /api/auth/login` rejects the action-required demo intents while unit-level `submitAuthScaffoldRequest()` accepts them
2. once that works, confirm browser smoke captures the disabled ready-panel CTA and checklist copy for both blocker states
3. keep the follow-up scoped to auth only; no unrelated refactors
