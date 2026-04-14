# HAVENLY auth/layout checkpoint — 2026-04-14 16:30 UTC

## Slice
Keep work in the main repo/worktree and fix the next real live auth/layout restore mismatch: the layout account-board panel could report `현재 보드가 계정 저장본과 같아요.` even when the current apartment context had drifted away from the saved board.

## Github sync safety
- worked in `/home/user1_admin/.openclaw/workspace/havenly-live` on `main`
- fetched earlier in-session and confirmed local `main` matched `origin/main` before editing
- no remote-ahead drift existed before this slice

## Page-context choice
Stayed page-scoped on Page 02 (`src/pages/layout-editor-page.jsx`) by reviewing only:
- `docs/HAVENLY_PAGE_02_LAYOUT_EDITOR.md`
- the latest auth/layout checkpoint notes
- the account-board comparison helper used by the layout property panel

No unrelated app pages were loaded into context.

## Real live issue reproduced
Using a fresh public auth tunnel against the deployed GitHub Pages site, a direct Playwright probe showed this customer-facing mismatch:

1. log in through the real backend on the live `#layout` page
2. save the board with `아크로 리버뷰 101A`
3. reload the deployed page
4. inspect the account-board panel
5. open `공간 정보`
6. observe the current selection already sits on `래미안 포레스트 84A`
7. close the overlay and inspect the account-board panel again

Observed problem before the fix:
- saved board copy still rendered `저장 기준 · 거실 · 아크로 리버뷰 101A`
- but the current board state in the overlay was already `래미안 포레스트 84A`
- the panel still said `현재 보드가 계정 저장본과 같아요.`
- `계정 저장본 불러오기` stayed disabled

That means the comparison helper was trusting a stale auth-session `draftSave` context strongly enough to hide a real restore/save drift situation.

## Coherent group edited
- `src/components/layout-auth-panel-state.js`
- `src/components/layout-auth-panel-state.test.js`
- generated Pages artifacts refreshed together via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`

## What changed
### 1) Persisted account-board context now wins over stale session draft-save context
`buildLayoutAuthPanelState(...)` previously mixed saved-board label/id sources in this order:
- `authSession.draftSave.*`
- then `authSession.accountState.*`

That allowed a stale session draft-save apartment id/label to mask the actual persisted account-board context.

Now, when an account-board context exists in `accountState`, the helper prefers the persisted account-board source first for:
- `savedDraftLabel`
- `savedApartmentSelectionId`

Only when the persisted account-board context is absent does it fall back to `authSession.draftSave`.

### 2) Added regression coverage for stale session draft-save data
New test proves that when:
- `draftSave` still says `래미안 포레스트 84A`
- but persisted `accountState` says `아크로 리버뷰 101A`
- and the current board is back on `래미안 포레스트 84A`

…the layout auth panel now:
- keeps the saved board context on `아크로 리버뷰 101A`
- detects context drift
- enables restore

## Validation before push
- `npm test -- --test-name-pattern='buildLayoutAuthPanelState'` ✅
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Next step
Commit + push this slice on `main`, wait for GitHub Pages to update, then re-run the direct live layout save/restore probe against the fresh public auth backend to confirm that the deployed board panel now exposes real drift and enables `계정 저장본 불러오기` when the current apartment context differs from the saved board.
