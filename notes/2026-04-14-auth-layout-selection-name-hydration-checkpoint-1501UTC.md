# HAVENLY auth/layout checkpoint — 2026-04-14 15:01 UTC

## Slice
Keep the work on the main repo/worktree and fix the next layout interaction bug discovered through the real deployed auth flow: after account-backed board hydration, the layout property panel could show `선택 없음` while still rendering the restored item position/blurb.

## Github sync safety
- worked only in `/home/user1_admin/.openclaw/workspace/havenly-live`
- started from `main` already synced with `origin/main`
- no remote-ahead drift was present before this edit/push cycle

## Why this slice
Live GitHub Pages probing against the fresh public auth backend (`https://5259bf0a93f8b0.lhr.life`) showed the auth/backend/database path is currently healthy enough to:
- bootstrap unauthenticated state
- open the guarded `로그인 후 보드 저장` handoff
- log in successfully
- restore the saved account-backed board on `#layout`

That live flow then exposed a narrower layout-state mismatch:
- the property panel showed `선택 없음`
- but the same panel still showed restored X/Y coordinates (`10`, `16`) and the sofa blurb

So the issue was not auth persistence itself anymore; it was the page-level selection snapshot presentation after hydrated board restore.

## Focused files touched together
- `src/components/layout-editor-view-state.js`
- `src/components/layout-editor-view-state.test.js`
- generated Pages artifacts via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`

## What changed
### 1) Selection snapshot now falls back to library metadata for the displayed name
`buildLayoutEditorSelectionSnapshot(...)` previously used only:
- `selectedItem?.name`
- else `선택 없음`

But the restored layout items can still have enough page-level identity through:
- `selectedItem.sourceId`
- `selectedMeta.name`

The selection snapshot now resolves the displayed name as:
1. `selectedItem?.name`
2. `selectedMeta?.name`
3. `선택 없음`

This keeps the account-restored layout panel coherent when the hydrated item shape is geometry-first but the library metadata is still available.

### 2) Added regression coverage for hydrated-name fallback
Extended the layout editor view-state tests with a case where:
- the selected item has coordinates/color index but no inline `name`
- the library metadata still has the product name + blurb

Expected result:
- property panel uses the metadata-backed item name
- rounded coordinates remain stable
- blurb continues to come from the selected metadata

## Live feedback that drove this slice
Target under test:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F5259bf0a93f8b0.lhr.life#layout`

Observed during manual Playwright probe before the fix:
- login request: `200 /api/auth/login`
- saved board restored into the layout editor
- account board summaries/timestamp looked healthy
- property panel mismatch remained:
  - `선택 오브젝트` → `선택 없음`
  - `위치` → `X 10 / Y 16`
  - blurb still matched the sofa item

That pointed directly at the page-level selection presentation helper rather than backend persistence.

## Validation before push
- targeted tests:
  - `npm test -- --test-name-pattern='buildLayoutEditorSelectionSnapshot|buildLayoutEditorPropertyPanelState'` ✅
- deploy build:
  - `npm run build:pages` ✅
- secret scan:
  - `npm run security:secrets` ✅

## No-log-ui check
- no debug/progress/report UI was added to the product surface
- all investigation details remain in notes/tests only

## Deploy checkpoint
- commit: `880a027`
- message: `Fix restored layout selection name`
- pushed to: `origin/main`

## Live verification after push
Against the deployed Pages site with the same public auth backend override:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F5259bf0a93f8b0.lhr.life#layout`

Observed after Pages updated to the new assets:
- deployed HTML included the new bundle names (`index-DJkpqh7p.js`, `main-_UXPeFoz.js`)
- the layout property panel now renders:
  - `선택 오브젝트` → `코튼베이지 모듈 소파`
  - `위치` → `X 10 / Y 16`
  - same sofa blurb remains intact

So the customer-facing selection panel is now internally coherent for the restored layout state instead of mixing a real item snapshot with the fallback `선택 없음` label.

### Evidence
- `playwright-artifacts/live-layout-selection-name-after-fix.png`

## If this is green
The next page-scoped auth/layout slice should stay on the layout editor and move to the next real post-login interaction edge, likely one of:
- save/restore drift after an intentional board change
- apartment-context change persistence on a live authenticated reload
- any remaining modal/ready-panel interaction mismatch found on deployed Pages
