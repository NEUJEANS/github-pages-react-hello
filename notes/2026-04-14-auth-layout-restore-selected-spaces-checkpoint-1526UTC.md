# HAVENLY auth/layout checkpoint — 2026-04-14 15:26 UTC

## Goal
Continue the main-worktree auth/layout/backend loop with a real product-facing slice, keep work page-scoped, and validate against the deployed GitHub Pages site plus a fresh public auth backend.

## Sync / safety first
- worked in `havenly-live` on `main`
- fetched/remain aligned with `origin/main` before edits
- ran secret scan before any GitHub upload:
  - `npm run security:secrets` ✅

## Relevant page slice chosen
Focused only on the layout editor auth/account-board restore path after reviewing the layout-page doc and the latest auth/layout notes.

Reason for choosing this slice:
- auth/backend/database persistence was already live and healthy
- the next product-facing gap was in the layout editor restore interaction itself
- saved board state already persisted `selectedSpaceIds`, but the direct in-editor `계정 저장본 불러오기` path did not reapply them

## Real issue found
The direct layout restore handler restored:
- apartment selection
- layout items
- tray items
- recommendation draft / room

…but did **not** restore the saved selected spaces (`selectedSpaceIds`) from account state or draft save context.

That meant the user could restore a saved board and still be left with a mismatched linked-space context, even though the backend/database already had the correct saved state.

## Coherent code slice edited
Edited only `src/main.jsx` in the layout/auth restore slice.

### Changes
1. Added a shared helper:
   - `syncSpaceProfileSelectedSpaces(selectedSpaceIds)`
2. Reused that helper in existing auth/session restore flows to reduce duplicate patchy space-sync logic.
3. Updated `handleRestoreSavedLayout()` so direct account-board restore now also reapplies:
   - `authSession.draftSave.selectedSpaceIds`
   - fallback to `authSession.accountState.selectedSpaceIds`

## Validation
### Focused tests
Ran targeted auth/layout-related tests:
- `npm test -- --test-name-pattern='auth-session-restore|layout-auth-panel-state|auth-storage|auth-backend-scaffold'` ✅

Result:
- 252 tests passed
- 0 failed

### Pages build checkpoint
- `npm run build:pages` ✅
- synced new build output into `docs/`

## Live validation setup
Because the OpenClaw browser server was unavailable, used the repo’s Playwright live-smoke path.

### Fresh public auth tunnel
Opened a fresh localhost.run HTTPS tunnel to the sqlite-backed auth server running at `http://127.0.0.1:4175`.

Fresh live auth base:
- `https://2b3568ae54f754.lhr.life`

Health check:
- `GET https://2b3568ae54f754.lhr.life/api/auth/health` ✅

### Live Pages URL under test
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F2b3568ae54f754.lhr.life#layout`

### Live smoke status so far
Ran:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F2b3568ae54f754.lhr.life#layout' --require-browser --layout-save-only
```

Observed current live blocker before deploying this new fix:
- smoke reached the real deployed app and real auth backend
- signup scenario started
- direct login scenario started
- save-draft scenario started
- then failed trying to click `로그인 후 보드 저장` because that CTA detached during the live page interaction

This looked like a live interaction/timing problem at the current deployed build, not an auth transport failure.

## Current repo state after this checkpoint
- product fix implemented locally
- focused tests green
- Pages build prepared
- fresh public auth tunnel active
- next required step: commit + push + wait for Pages deploy + rerun live deployed-site smoke against the fresh auth tunnel to confirm the saved-space restore fix on the real site
