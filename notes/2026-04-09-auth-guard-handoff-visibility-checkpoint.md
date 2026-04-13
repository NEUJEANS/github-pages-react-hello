# 2026-04-09 — auth guard handoff visibility checkpoint

## What changed
- added `buildAuthGuardPanelState` so the guarded login modal has a focused, serializable view of the guest draft context before the user submits auth
- surfaced the exact guarded-login handoff details in the guard card: `handoffId`, draft context bits, `draftSave` bits, login intent, and backend connection target/credentials source
- added focused coverage in `auth-session-view-state.test.js` for the guarded login summary state

## Why
The login modal already showed rich auth handoff context after entering the form, but the guarded-login step still only showed a coarse draft summary. This moves the backend wiring visibility earlier in the flow so the guarded login path exposes the same realistic handoff contract the frontend is about to send to the auth scaffold.

## Validation
- `node --test src/components/auth-session-view-state.test.js src/components/auth-flow-state.test.js src/components/auth-storage.test.js`
- `npm run build`
- `npm run smoke:auth`

## Next auth-first step
- thread the same guard-panel contract into the browser smoke assertions so regressions in guarded-login handoff visibility are caught automatically
- then tighten the merge-confirmation branch so the guarded login path shows the selected resolution and continuation contract more explicitly before submit
