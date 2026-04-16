# HAVENLY parallel checkpoint — 2026-04-05 layout editor render state helper

## What changed
- Extended `src/components/layout-editor-view-state.js` with two pure render helpers: one for placed-item classnames and one for the inline style object used by each placed furniture node.
- Updated `src/main.jsx` so the layout editor now consumes those helpers instead of rebuilding the class/style strings inline.
- Swapped the layout editor's click-to-move centering math over to the already-tested `resolveRoomClickTarget` helper from `src/components/layout-canvas-layout-canvas-editor-state.js`, removing another tiny chunk of duplicated geometry logic from `main.jsx`.
- Added focused tests in `src/components/layout-editor-view-state.test.js` covering the new classname/style helpers.

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- `BASE_REF=HEAD npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0957UTC.md`
  - Useful takeaway: keep layout-editor view cleanup source-only and continue checking that tracked `dist/` output stays out of these loop commits.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit source-only. ✅

## Next smallest checkpoint
1. Extract one more tiny layout-editor presentation helper, such as selected-item property panel copy or editor info-pill text, only if it stays obviously testable.
2. Or do a very small browser polish pass on the layout editor to confirm the render-helper cleanup did not change drag/click-move behavior.

## Branch
- `havenly/parallel-loop-2026-04-04`
