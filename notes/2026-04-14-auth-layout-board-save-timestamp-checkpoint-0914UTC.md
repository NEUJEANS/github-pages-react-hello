# HAVENLY auth/layout checkpoint — 2026-04-14 09:14 UTC

## Slice
Persist a real board-save timestamp through both auth backends (sqlite server + scaffold) and surface that saved-board freshness in the layout account panel.

## Why this slice
The live GitHub Pages layout flow is currently green for the core authenticated board save/restore path:
- login as `board@example.com`
- continue "로그인 후 보드 저장"
- save/restore on `#layout`
- reload while signed in

A focused live Playwright check on the deployed site confirmed the account board no longer shows false drift immediately after auth/restore.

With that core flow green, the next highest-value auth/backend step was to make saved-board state more real and less session-derived:
- stop inferring board freshness from generic auth session timestamps
- persist an actual layout-board save timestamp in account-backed state
- carry it through both runtime shapes so scaffold/live Pages and sqlite/proxy stay in sync

## Github sync safety
- checked/fetched `main` before editing
- worked only in the main HAVENLY repo/worktree: `/home/user1_admin/.openclaw/workspace/havenly-live`
- kept scope to the layout page + auth save-state modules only

## Focused files touched together
### Layout page / page-level state
- `src/pages/layout-editor-page.jsx`
- `src/components/layout-auth-panel-state.js`
- `src/components/layout-auth-panel-state.test.js`
- `src/main.jsx`

### Auth session/account continuity
- `src/components/auth-account-continuity.js`
- `src/components/auth-account-continuity.test.js`
- `src/components/auth-storage.js`

### Same-origin scaffold auth backend
- `src/components/auth-backend-scaffold.js`
- `src/components/auth-backend-scaffold.test.js`

### Real sqlite-backed auth backend
- `server/auth-persistent-store.js`
- `server/auth-persistent-store.test.js`
- `server/auth-http-server.test.js`

## What changed
### 1) Persisted `layoutBoardSavedAt` in account state
Both auth backends now stamp account-backed layout saves with a real ISO timestamp:
- scaffold path updates `accountState.layoutBoardSavedAt` when `save-layout-draft` continuation completes
- sqlite-backed server path updates `accountState.layoutBoardSavedAt` in `applyDraftSaveToAccountState()`

This makes board-save freshness a property of the saved board itself, not just a side effect of when the auth session object was last rewritten.

### 2) Kept serialized session/account helpers in sync
The frontend auth/session serializers now preserve `layoutBoardSavedAt` so reload/bootstrap flows keep the same saved-board freshness signal across:
- persisted auth session reads
- post-auth restore patches
- account continuity snapshots

### 3) Layout account panel now prefers the real board-save timestamp
`buildLayoutAuthPanelState()` now prefers:
1. `accountState.layoutBoardSavedAt`
2. current save action timestamp fallback
3. generic auth session timestamp fallback

It also derives a customer-facing label:
- `최근 저장 · YYYY-MM-DD HH:MM UTC`

### 4) Surfaced saved-board freshness in the layout panel
The layout editor account-board block now renders the saved-board timestamp as part of the product UI, not as a debug/status panel.

This is useful live feedback for the save/restore workflow and helps distinguish:
- account board freshness
- current board drift state
- generic auth session restore timing

## Validation
### Live deployed-site feedback before this checkpoint
One-off Playwright check against:
- `https://neujeans.github.io/github-pages-react-hello/#layout`

Observed before editing:
- ready card: `board@example.com 계정 연결됨`
- account board showed matching saved/current board summaries
- comparison copy: `현재 보드가 계정 저장본과 같아요.`
- restore CTA hidden/disabled because there was no drift

That live result guided this checkpoint toward backend contract realism instead of more drift-copy fixes.

### Tests
- focused tests for edited auth/layout slices ✅
- full suite: `npm test` ✅ (`238` passing)

### Build / safety
- `npm run build:pages` ✅
- emitted Pages asset: `assets/index-DBydQF-L.js`
- `npm run security:secrets` ✅

## Next step
Commit and push this checkpoint to `main`, wait for GitHub Pages to serve `index-DBydQF-L.js`, then run a live browser check that confirms the saved-board panel now shows the persisted "최근 저장" line on the deployed `#layout` page after an authenticated board save.
