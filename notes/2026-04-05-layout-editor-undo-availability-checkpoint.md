# HAVENLY parallel checkpoint — 2026-04-05 layout editor undo availability

## What changed
- Updated `buildLayoutEditorToolbarButtons()` in `src/components/layout-editor-view-state.js` to expose per-button `disabled` metadata and accept a `canUndo` flag for the undo control.
- Threaded `canUndo` out of `useEditorState()` in `src/main.jsx` so the layout editor toolbar now reflects whether history exists before enabling undo.
- Bound toolbar buttons to the helper-provided disabled state in `src/main.jsx`, preventing no-op undo clicks when there is nothing to roll back.
- Added a small disabled visual treatment for `.tool` buttons in `src/styles.css` so unavailable controls look intentionally inactive.
- Refreshed `src/components/layout-editor-view-state.test.js` to cover the new undo availability metadata.

## Validation
- `git fetch --all --prune` ✅ (branch remained aligned with `origin/havenly/parallel-loop-2026-04-04` before edits)
- `npm test -- --runInBand` ✅
- `npm run build` ✅
- `BASE_REF=HEAD npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_1527UTC.md`
- Reverted regenerated `dist/index.html` before checkpointing to keep this commit source-only. ✅

## Notes
- Build validation surfaced a stray duplicated JSX tail at the end of `src/main.jsx`; removed it as part of this checkpoint because it blocked `vite build`.

## Next smallest checkpoint
1. Do a quick browser smoke pass on the layout editor to confirm the disabled undo styling feels consistent with the rest of the toolbar.
2. Consider extracting the toolbar click dispatch into a tiny helper so the editor screen stops hard-coding the control behavior map inline.

## Branch
- `havenly/parallel-loop-2026-04-04`
