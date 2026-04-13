# 2026-04-09 — auth continuation endpoint preview checkpoint

## What changed
- replaced hard-coded `/api/auth/continue` copy in the login modal with the actual configured continuation endpoint from `authContinuationPlan`
- taught `buildAuthReadyPanelState` to carry an overridden continuation endpoint into the payload preview contract for action-required auth flows
- added unit coverage proving the ready-panel payload preview keeps a custom continuation endpoint when backend wiring is overridden

## Why
The login and action-required auth panels were still describing the continuation hop as if it always posted to `/api/auth/continue`, even when runtime/query config points the frontend at a different scaffold/backend path. That made the frontend auth wiring look less real than it is and could mislead follow-up integration work.

## Validation
- `node --test src/components/auth-session-view-state.test.js src/components/auth-flow-state.test.js src/components/auth-submit.test.js`

## Notes
- `npm run smoke:auth`/`auth-login-smoke.mjs` still appears to hang in this environment after build/preview startup, so this checkpoint relies on the targeted unit coverage above rather than a completed browser smoke pass.

## Next auth-first step
- make the browser smoke assert a non-default continuation endpoint override end-to-end once the hanging smoke runner is stabilized
- then wire one real frontend action-required screen (likely complete-profile or verify-email) to consume the same continuation contract without modal-only copy
