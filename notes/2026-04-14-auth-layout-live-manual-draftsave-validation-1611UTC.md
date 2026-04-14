# HAVENLY live validation — 2026-04-14 16:11 UTC

## Deployed checkpoint under test
- commit: `316b1fb`
- message: `Refresh auth draft saves from live board context`
- live bundle observed on GitHub Pages: `assets/index-BYZYG70v.js`
- live URL under test:
  - `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F3f1b9fc17ba35e.lhr.life#layout`

## Public auth/backend path
- local sqlite auth server health: `http://127.0.0.1:4175/api/auth/health` ✅
- fresh public tunnel health: `https://3f1b9fc17ba35e.lhr.life/api/auth/health` ✅

## Why this live check mattered
The new local code slice changed how auth draft-save payloads are assembled before save/continuation requests reach the backend/database. The important live question was whether the deployed site now persists the *current* layout board context (apartment-linked-space state) rather than stale authenticated draft-save metadata.

## Direct live browser verification completed
Used Playwright directly against the deployed GitHub Pages site and real public auth backend.

### Flow exercised
1. open deployed layout page
2. click `로그인 후 보드 저장`
3. continue through the login guard
4. log in with the real backend-backed account flow
5. resume into the layout board
6. open `공간 정보`
7. switch apartment to `아크로 리버뷰 101A`
8. close the overlay
9. click `현재 보드 다시 저장`
10. reload the deployed page
11. verify the saved account-board context still reflects the updated apartment selection

## Live result
### Save side now reflects the current board context
Observed board panel text immediately after save:
- `저장 기준 · 거실 · 아크로 리버뷰 101A`
- `최근 저장 · 2026-04-14 16:09 UTC`
- success copy: `현재 배치를 계정 저장본으로 업데이트했어요.`

This confirms the outgoing authenticated save payload carried the currently edited layout board context through the real backend/database path.

### Reload still reflects the updated saved board
Observed after reloading the deployed page:
- board panel still showed `저장 기준 · 거실 · 아크로 리버뷰 101A`
- saved timestamp remained present
- no stale fallback to the earlier apartment context appeared

This is the key live proof that the new draft-save payload merge logic persisted the current board context into account-backed saved state and that GitHub Pages is serving the new behavior.

## Evidence captured
- `playwright-artifacts/live-auth-draftsave-merge-success.png`

## Extra live finding
The generic smoke harness path (`scripts/auth-login-smoke.mjs --layout-save-only`) still intermittently flakes on the very first `로그인 후 보드 저장` click in the save-draft scenario, even though the targeted direct live browser flow above succeeds against the deployed site.

Current read:
- product/backend/database slice validated live ✅
- remaining issue appears to be automation-harness timing/stability, not the deployed auth/layout save behavior itself

## Best next slice
Stay page-scoped on layout/auth interactions, but shift from save payload correctness to the next product-facing account-board interaction boundary exposed by live use. Strong candidates:
1. restore-entrypoint UX and context confirmation after authenticated save/reload, or
2. harden the live smoke harness only if it is actively blocking the next product checkpoint.
