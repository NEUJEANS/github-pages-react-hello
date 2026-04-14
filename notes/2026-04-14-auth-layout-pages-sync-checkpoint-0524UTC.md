# HAVENLY auth/layout Pages sync checkpoint — 2026-04-14 05:24 UTC

## Why this slice came first
The latest auth/layout UI checkpoint (`da66bca`) was green locally but the live GitHub Pages site kept serving the stale bundle (`index-Dp9eRo5L.js`). That blocked the required push → live-check → next-slice loop, so this slice focused on making the deployed Pages output deterministic again.

## Changes in this slice
- Added `scripts/sync-dist-to-docs.mjs`
  - copies the fresh Vite output from `dist/` into the tracked `docs/` publish surface
  - only replaces `docs/index.html` and `docs/assets/`, leaving the page architecture markdown docs intact
- Added `npm run build:pages`
  - runs `vite build`
  - then syncs the resulting bundle into `docs/`
- Updated `.github/workflows/deploy.yml`
  - the Pages workflow now runs `npm run build:pages` instead of plain `npm run build`
  - this keeps the CI artifact and the tracked `docs/` output aligned, which should stop the stale-live mismatch that was derailing live verification

## Validation
- `npm run build:pages` ✅
  - produced fresh app bundle `dist/assets/index-B6BjmI9R.js`
  - synced `docs/index.html` to reference `assets/index-B6BjmI9R.js`
- `npm test` ✅ (`229` passing)
- `npm run security:secrets` ✅

## Expected next live result after push
Once this checkpoint is pushed, GitHub Pages should stop serving the older `index-Dp9eRo5L.js` bundle and start serving `index-B6BjmI9R.js`. After that, the next pass should return to real auth/layout product behavior instead of deploy lag triage.

## Next auth/layout slice after live confirms
- Re-open the live `#layout` page
- Verify the authenticated account-board panel now reflects the current saved-vs-current copy from `da66bca`
- Use that live result to choose the next backend/auth/layout improvement instead of guessing from stale production output
