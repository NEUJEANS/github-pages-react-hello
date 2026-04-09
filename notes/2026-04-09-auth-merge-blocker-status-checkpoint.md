# 2026-04-09 auth merge blocker status checkpoint

## What changed
- taught `src/components/auth-backend-scaffold.js` to return an explicit action-required status contract for the guarded merge path (`nextAction: confirm-merge-resolution`)
- merge-conflict login responses now include `status: action-required` plus `statusLabel: 초안 병합 방향 확인 필요`, matching how complete-profile and verify-email blockers already behave
- extended `buildAuthErrorSummary()` / `buildAuthStatusCopy()` so the login modal can carry that merge-blocker label through the error state instead of treating merge confirmation as an unlabeled 409
- added focused test coverage in:
  - `src/components/auth-backend-scaffold.test.js`
  - `src/components/auth-flow-state.test.js`
- also exposed the merge-blocker status fields in the smoke JSON payload so later loop runs can inspect them once the preview/browser path stops dropping them

## Why this matters
This is a small but real step toward wiring the frontend auth flow to a backend-shaped contract instead of relying on special-case merge logic. The guarded login path now describes merge confirmation the same way the other auth blockers do: explicit next action + explicit blocker status + human label.

That should make the login modal and any future real backend integration less brittle, because the UI can reason about merge confirmation as another action-required auth state rather than as a one-off error shape.

## Checks
- `git fetch --all --prune`
- `node --test src/components/auth-backend-scaffold.test.js src/components/auth-flow-state.test.js` ✅
- `node ./scripts/auth-login-smoke.mjs` ✅ HTTP fallback path still passes in this workspace
  - browser path still times out waiting for `.loginPanel .loginForm`, so the smoke falls back to HTTP mode for now

## Next auth-first step
- trace why the preview/browser smoke is still dropping the merge blocker detail / timing out before the login form becomes visible
- once that is stable, assert the guarded browser flow shows the new merge `action-required` label before the user picks a merge direction
