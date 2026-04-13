# 2026-04-11 — auth inline verified copy checkpoint

## What I changed
- Kept the standalone auth proxy/callback work already present in the branch and took the next frontend slice in `src/main.jsx`.
- When `/api/auth/verification/status` returns `verified`, the login modal now immediately shows the exact green inline copy the user asked for:
  - `본인인증이 완료되었습니다`
- Added a local continuation normalization step so the in-memory auth session/login form try to flip `verify-email` into `resume-authenticated-flow` as soon as verification is confirmed.
- Persisted that optimistic continuation patch back into local storage so a quick reload has a better chance of seeing the resumed state.
- Updated `scripts/auth-login-smoke.mjs` to assert the exact inline success copy instead of the older looser message match.

## Validation
- `npm test` ✅
- `npm run smoke:auth:proxy` ❌ still failing in `verify-email-scenario`

## Current failure shape
- The popup callback succeeds and the inline verified copy can appear.
- But after reload, the verify-email ready card still does **not** consistently advance away from `이메일 인증 확인` under the proxy smoke path.
- This means there is still a race/mismatch between:
  1. verification callback completion,
  2. persisted session/bootstrap state returned on reload, and
  3. ready-panel continuation derivation.

## Likely next slice
1. Inspect the proxied `/api/auth/session` payload immediately after popup callback in the smoke path.
2. Compare persisted session continuation before/after reload (frontend local storage vs backend `/session`).
3. If backend `/session` is still returning `verify-email`, fix the server-side verification finalization/session serialization path.
4. If backend is correct but bootstrap downgrades the state, patch the bootstrap/rehydration path instead of the modal polling path.

## Notes
- Working tree already contained substantial unrelated/in-progress HAVENLY edits before this checkpoint (`server/auth-http-server.js`, `vite.config.js`, etc.), so I avoided sweeping cleanup and kept this slice narrow.
