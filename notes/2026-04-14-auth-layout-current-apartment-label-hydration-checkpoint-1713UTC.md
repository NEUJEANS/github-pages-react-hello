# HAVENLY auth/layout checkpoint — 2026-04-14 17:13 UTC

## Slice
Keep the work on the main repo/worktree and fix the next live layout/auth inconsistency discovered on the deployed GitHub Pages site: after switching apartments inside the authenticated layout editor, the account-board comparison copy could fall back to the short unit summary (`101A · 3개 공간 선택`) instead of the hydrated apartment label (`아크로 리버뷰 101A`).

## Github sync safety
- worked only in `/home/user1_admin/.openclaw/workspace/havenly-live`
- started from `main` with `origin/main` already synced
- no remote-ahead drift was present before this edit/push cycle

## Why this slice
Live deployed-site validation against a fresh public auth backend showed that the real auth/backend/database path was healthy enough to:
- log in from GitHub Pages through a public HTTPS auth base
- restore the saved account-backed board
- switch the current apartment in the layout-space overlay
- restore the saved board again

That exposed a narrower product-facing mismatch in the property-panel account-board copy:
- saved context rendered the full apartment label: `래미안 포레스트 84A`
- current context rendered only the shorter summary fallback: `101A · 3개 공간 선택`

Save/restore behavior itself was already working, but the current context label was inconsistent and looked less trustworthy than the saved one.

## Focused files touched together
- `src/components/layout-auth-panel-state.js`
- `src/components/layout-auth-panel-state.test.js`
- `src/main.jsx`
- generated Pages artifacts via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`

## What changed
### 1) Current board context now accepts a hydrated apartment label
`buildLayoutAuthPanelState(...)` now accepts `currentApartmentLabel` in addition to the existing short `draftLabel` summary.

### 2) Board context copy prefers apartment labels over shorter summaries
`buildBoardContextCopy(...)` now prefers `apartmentLabel` first and only falls back to `draftLabel` when no hydrated apartment label is available.

This keeps the current layout-side account-board context aligned with the saved-board copy style when the app already knows the selected apartment metadata.

### 3) Main layout page now passes the selected apartment label into the auth/layout panel state
`src/main.jsx` now provides:
- `currentApartmentLabel: selectedApartment ? formatApartmentOption(selectedApartment) : null`

So the page-scoped auth/layout state can render the full apartment label after in-editor apartment switches without widening unrelated app reads.

### 4) Added regression coverage
Added a focused test that confirms the current-board comparison copy prefers:
- `아크로 리버뷰 101A`

instead of falling back to:
- `101A · 3개 공간 선택`

when both are available.

## Validation before push
- targeted tests:
  - `npm test -- --test-name-pattern='buildLayoutAuthPanelState'` ✅
- deploy build:
  - `npm run build:pages` ✅
- secret scan:
  - `npm run security:secrets` ✅

## No-log-ui check
- no debug/progress/report UI was added to the product surface
- all investigation details remain in notes/tests only

## Live issue that drove this slice
Live deployed URL under test before the fix:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F33ad4ad3b70592.lhr.life#layout`

Observed after login → 보드 저장 이어가기 → apartment switch to `아크로 리버뷰 101A`:
- saved context: `저장 기준 · 거실 · 래미안 포레스트 84A · 선택 공간 3개`
- current context: `현재 기준 · 거실 · 101A · 3개 공간 선택 · 선택 공간 3개`

The save/restore mechanics were correct, but the current label was still using the shorter summary fallback.

## Next live validation target after push
Re-test the deployed Pages app with a fresh public auth URL and confirm the current-board context now reads:
- `현재 기준 · 거실 · 아크로 리버뷰 101A · 선택 공간 3개`

while preserving the already-working authenticated restore/save path.
