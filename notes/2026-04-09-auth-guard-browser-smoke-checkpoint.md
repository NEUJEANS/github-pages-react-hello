# 2026-04-09 — auth guard browser smoke checkpoint

## What changed
- taught `scripts/auth-login-smoke.mjs` to read the guarded-login handoff card before the modal proceeds
- added an explicit assertion that the guard preview exposes the auth-first contract bits we now care about: selected spaces, recommendation hint, layout count, handoff id, draft-save handoff, login intent, and backend connection target
- included the captured guard preview details in the smoke JSON so later loop runs can inspect exactly what the browser saw when the guarded login flow opened

## Why
The guarded login modal already surfaced the right draft/auth handoff information in UI, but our browser smoke was not checking it. That left the login-first path vulnerable to regressions where the modal could quietly stop showing the backend wiring context before submit. This keeps coverage focused on the auth handoff path instead of general refactors.

## Validation
- `node --test src/components/auth-session-view-state.test.js src/components/auth-flow-state.test.js src/components/auth-storage.test.js`
- `npm run smoke:auth`

## Next auth-first step
- make the guarded merge continuation path visibly show which merge resolution will be sent to `/api/auth/continue` before submit, then cover that contract in the browser smoke too
- after that, tighten the backend scaffold/login contract so login and continuation share one clearer serialized auth handoff shape end-to-end
