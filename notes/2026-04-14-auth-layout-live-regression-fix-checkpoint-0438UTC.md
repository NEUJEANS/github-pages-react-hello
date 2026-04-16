# HAVENLY auth/layout checkpoint — 2026-04-14 04:38 UTC

## Slice completed
Fixed a live regression uncovered immediately after the restore-drift checkpoint: the deployed app shell was crashing on load because layout draft labels were being built from `selectedApartment` instead of the `spaceProfile` object that `buildLayoutAddressSummary()` expects.

## What changed
- `src/main.jsx`
  - restored the layout auth panel draft-label source to `buildLayoutAddressSummary(spaceProfile)`.
  - restored authenticated board-save intent/draft payload labels to the same `spaceProfile`-based summary.
  - kept the tray/recommendation drift work intact.

## Why this mattered
The first checkpoint’s live verification exposed a hard blocker more important than the original restore-gating polish: the GitHub Pages site failed to render at all on `#layout` because `buildLayoutAddressSummary()` dereferenced `.spaces.length` from the wrong object shape.

That meant the product could not reach the very auth/layout area this loop is supposed to improve. Fixing the crash took priority over moving to another backend/auth slice.

## Validation
- `npm test -- src/components/layout-auth-panel-state.test.js`
  - green (package test expansion remained green)
- `npm run build`
  - green
- Local browser verification against dev server:
  - `http://127.0.0.1:4174/github-pages-react-hello/#layout`
  - layout page now renders successfully
  - 43 buttons detected in the rendered UI
  - layout/editor/auth-save surface text is visible again
  - no accidental debug/report/process UI was observed in the rendered screen copy
- Live GitHub Pages verification before this fix:
  - reproduced runtime crash on `https://neujeans.github.io/github-pages-react-hello/#layout`
  - stack resolved to `buildLayoutAddressSummary()` path in `src/components/recommendation-layout-derivations.js` via `src/main.jsx`

## Next likely live check
After republish, re-open the GitHub Pages layout page and confirm the crash is gone there too. Once the live shell is healthy again, return to the intended auth/layout checkpoint: verify that authenticated restore CTA gating now reacts to tray-only board drift.
