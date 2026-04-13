# HAVENLY parallel checkpoint — 2026-04-05 layout editor hint state

## What changed
- Added `buildLayoutEditorHint()` plus a shared `defaultLayoutEditorHintBadge` constant in `src/components/layout-editor-view-state.js` so the layout-editor hint row now comes from one pure helper instead of inline copy in `src/main.jsx`.
- Made the hint description respond to the snap toggle, keeping the badge stable while clarifying when free placement is active.
- Updated `LayoutEditorScreen` in `src/main.jsx` to render the hint badge and description from helper-driven state.
- Added focused coverage in `src/components/layout-editor-view-state.test.js` for both snap-on and snap-off hint variants.

## Validation
- `git fetch --all --prune` ✅ (branch remained in sync with `origin/havenly/parallel-loop-2026-04-04` before edits)
- `npm test -- --runInBand` ✅
- `npm run build` ✅
- `BASE_REF=HEAD npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_1357UTC.md`
  - Useful takeaway: keep reverting tracked build artifacts unless a checkpoint intentionally includes them.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit source-only. ✅

## Next smallest checkpoint
1. Extract one more tiny layout-editor presentation helper from `main.jsx`, such as the selected-color action row metadata or a stable property-panel status block.
2. If browser automation is healthy again, do a direct smoke pass on the layout editor to validate the accumulated helper-driven UI wiring.

## Branch
- `havenly/parallel-loop-2026-04-04`
