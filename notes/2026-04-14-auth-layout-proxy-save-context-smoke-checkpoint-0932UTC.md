# HAVENLY auth/layout proxy save-context smoke checkpoint — 2026-04-14 09:32 UTC

## Slice
Tighten the real sqlite/proxy auth regression net around the layout board save path by validating that apartment context and tray state survive the authenticated save/resume flow, not just the bare layout item list.

## Why this slice
The main repo already had green coverage for core auth continuation and saved-board timestamps, but the real backend path still had a parity gap:
- sqlite/http tests covered persisted `layoutItems` and `layoutBoardSavedAt`
- they did **not** explicitly lock in `apartmentSelectionId` or `layoutTrayItems`
- the browser smoke save-draft scenario also stopped short of actually changing apartment context, re-saving, and asserting that the saved board panel preserved that context after reload

That left a real risk that layout/account context could drift again while item-save tests still passed.

## Github sync safety
- verified work in `/home/user1_admin/.openclaw/workspace/havenly-live`
- fetched remote before editing
- local `main` was already aligned with `origin/main` before this slice
- kept scope to the real auth backend tests plus the focused save-draft browser smoke path

## Focused files touched together
### Real backend persistence coverage
- `server/auth-persistent-store.test.js`
- `server/auth-http-server.test.js`

### Proxy-backed browser smoke
- `scripts/auth-login-smoke.mjs`

## What changed
### 1) Extended sqlite-backed auth persistence tests
The persistent-store save-layout continuation test now asserts that a real draft save also persists:
- `apartmentSelectionId`
- `layoutTrayItems`
- existing `layoutItems`
- existing `layoutBoardSavedAt`
- recommendation draft fields

### 2) Extended standalone HTTP auth server coverage
The real HTTP auth server test now mirrors that stronger contract and verifies the same fields survive across:
- `/api/auth/continue`
- subsequent `/api/auth/session`

This keeps the sqlite store + standalone server contract aligned with the layout page’s saved-board UI expectations.

### 3) Upgraded the proxy browser smoke from “resume ready” to “save + reload context persistence”
The proxy-backed smoke’s save-draft scenario now:
1. logs in as `board@example.com`
2. resumes the guarded `save-layout-draft` flow
3. opens `공간 정보`
4. switches the apartment to `아크로 리버뷰 101A`
5. closes the overlay
6. clicks `현재 보드 다시 저장`
7. asserts the layout account panel shows:
   - `저장 기준 · 거실 · 아크로 리버뷰 101A`
   - `최근 저장 · ... UTC`
8. reloads the page
9. asserts the same saved-board context still appears after reload

That turns the smoke into a much closer regression check for the real auth/backend/database + layout interaction slice.

## Validation
### Focused tests
- `node --test server/auth-persistent-store.test.js server/auth-http-server.test.js` ✅

### Real browser + sqlite/proxy smoke
- `npm run smoke:auth:proxy` ✅
- confirmed the upgraded save-draft scenario passed after selecting `아크로 리버뷰 101A`, re-saving, and reloading

### Build / upload safety
- `npm run build:pages` ✅
- emitted Pages asset remained `assets/index-DBydQF-L.js`
- `npm run security:secrets` ✅

## Live-site verification note
I attempted to use the OpenClaw browser tool for the live GitHub Pages verification step, but the browser control service timed out and explicitly reported that retrying would keep failing until the gateway/browser service is restarted.

Because that blocker was tool-side rather than a product failure or a human-required step, I continued with:
- repo-safe code changes
- sqlite/http test coverage
- proxy-backed real browser smoke
- Pages rebuild readiness

## Next likely slice
After pushing this checkpoint, the next auth/backend/layout step should stay on real persistence parity rather than copy-only polish. Best candidates:
- exercise the same apartment/tray save-context path against any deployed auth backend target (not only local proxy smoke)
- extend the save/restore flow to assert restore-from-account after intentional board drift, not just save + reload
- if the browser control service is healthy again, run the same `#layout` live GitHub Pages verification loop directly in browser against the deployed site
