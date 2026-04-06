# HAVENLY parallel checkpoint — 2026-04-06 auth bootstrap/logout smoke slice

## What changed
- Extended `scripts/auth-login-smoke.mjs` so the auth-focused smoke covers one more realistic lifecycle after login instead of stopping at the first success state.
- The HTTP fallback smoke now verifies scaffold session teardown too: after a successful guarded login it calls `POST /api/auth/logout` and confirms `GET /api/auth/session` returns `401`.
- The browser-path smoke now records the post-login reload/bootstrap path and logout return path when Playwright is available:
  - login modal success
  - close modal and reload
  - auth session notice + account trigger still restored
  - logout returns the shell to the logged-out button state
- Kept the work tightly scoped to login/auth flow wiring rather than general refactoring.

## Verification
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- `npm run smoke:auth -- http://127.0.0.1:4173/github-pages-react-hello/` ✅ (HTTP fallback path in this workspace)
- `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini` ✅ output captured in `ai-reviews/gemini-review-2026-04-06_2131UTC.md`

## Why this matters for auth priority
- It validates more of the real login lifecycle we actually care about now: success → persisted/restored session shell → logout/session clear.
- That makes the backend scaffold a little more trustworthy as a stand-in while frontend auth keeps moving toward a real backend contract.
- It also gives the next passes a concrete harness for checking that login modal changes do not silently break restore/logout behavior.

## Next smallest checkpoint
1. Make the browser smoke runnable locally/consistently in this workspace so the reload/bootstrap assertions execute through the UI, not only the HTTP fallback.
2. Add one external-auth-base-url smoke variant so configured backend targets get exercised, not just same-origin scaffold paths.
3. Start threading a backend-style `nextAction`/resume token through the successful auth response if the scaffold contract expands.
