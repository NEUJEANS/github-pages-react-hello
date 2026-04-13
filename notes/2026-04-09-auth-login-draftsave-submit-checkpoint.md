# 2026-04-09 — auth login draft-save submit checkpoint

## What changed
- wired `buildAuthSubmitPlan` to carry a serializable `draftSave` payload on the initial login request
- reused the existing `authDraftSavePayload` in `main.jsx` for both the memoized login submit plan and the actual login submit handler
- added focused coverage proving login submit plans now include normalized `draftSave` handoff data

## Why
The continuation flow already preserved serializable draft-save payloads, but the first login request still dropped that context. This closes a real handoff gap in the login/auth path and moves the frontend one step closer to sending the same minimal draft context to a real backend contract.

## Validation
- `node --test src/components/auth-flow-state.test.js src/components/auth-backend-scaffold.test.js src/components/auth-storage.test.js`
- `npm run smoke:auth`

## Next smallest step
- surface the login-request `draftSave` summary in the modal/ready UI so backend wiring is visible without reading devtools
- then tighten the real backend contract shape so login and continuation use the same auth handoff fields end-to-end
