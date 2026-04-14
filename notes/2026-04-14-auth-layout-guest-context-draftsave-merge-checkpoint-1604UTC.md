# HAVENLY auth/layout checkpoint — 2026-04-14 16:04 UTC

## Slice
Keep the work in the main repo/worktree and tighten one coherent auth/layout save slice: when an authenticated user saves from the current layout board, prefer the live in-editor board context over stale saved draft metadata before the payload goes to the backend/database.

## Github sync safety
- worked in `havenly-live` on `main`
- fetched `origin` and confirmed local `main` was aligned with `origin/main` before continuing edits
- no remote drift was present before this slice

## Page-context choice
Reviewed only the layout-editor page summary plus the latest layout/auth checkpoints, then stayed inside the save/restore/auth payload path that feeds Page 02 (`src/pages/layout-editor-page.jsx`) through `src/main.jsx` and one new auth payload helper.

## Why this slice
The previous checkpoint fixed restore so saved `selectedSpaceIds` come back into the layout editor, but there was still a nearby product/backend risk on the save side:
- authenticated session draft-save data can lag behind the current guest/layout board state
- if the user changes apartment / linked spaces / tray contents and then saves, the outgoing auth draft-save payload should reflect the current board, not stale saved account metadata
- this is especially important now that the account-board flow is acting like the real persistence boundary for the live auth/backend/database path

## Coherent files grouped together
- `src/main.jsx`
- `src/components/auth-draft-save-payload.js`
- `src/components/auth-draft-save-payload.test.js`
- generated Pages artifacts refreshed together via `npm run build:pages`

## Change made
Extracted auth draft-save payload construction out of `main.jsx` and changed the merge behavior:

1. New helper module: `buildAuthDraftSavePayload(...)`
2. It still prefers an explicit login-form draft-save when one exists.
3. When only authenticated-session draft-save data exists, it now merges the current guest/layout snapshot over that saved session payload instead of blindly reusing the older session payload.
4. Fields updated from the live board snapshot include:
   - `draftLabel`
   - `apartmentLabel`
   - `apartmentSelectionId`
   - `recommendationRoom`
   - `recommendationDraft`
   - `selectedSpaceIds`
   - `layoutItems`
   - `layoutTrayItems`

This keeps the outgoing save payload aligned with what the user is actually seeing/editing in the layout page before that payload is sent through auth continuation and persisted into sqlite-backed account state.

## Tests / verification before push
Ran a focused validation set for this save/restore/auth slice:
- `npm test -- --test-name-pattern='auth-draft-save-payload|auth-session-restore|layout-auth-panel-state|auth-storage|auth-backend-scaffold'` ✅
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

Result:
- 255 tests passed
- 0 failed
- secret scan clean

## Fresh public auth backend for live Pages verification
- local backend health: `http://127.0.0.1:4175/api/auth/health` ✅
- opened fresh localhost.run HTTPS tunnel to the local sqlite-backed auth server
- fresh public auth base URL: `https://3f1b9fc17ba35e.lhr.life`
- public health check: `GET https://3f1b9fc17ba35e.lhr.life/api/auth/health` ✅

## Next step after this checkpoint
Commit + push this coherent save-payload slice, wait for GitHub Pages to pick up the new build, then live-test the deployed site in browser/Chrome using:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F3f1b9fc17ba35e.lhr.life#layout`

The live check should focus on whether authenticated layout save / restore now preserves the current apartment-linked-space board context cleanly on the deployed site, so the next checkpoint can be guided by real product feedback instead of local-only assumptions.
