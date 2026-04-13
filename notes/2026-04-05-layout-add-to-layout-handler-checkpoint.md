# HAVENLY parallel checkpoint — 2026-04-05 shared add-to-layout handler

## What changed
- Added a shared `addProductToLayout()` callback in `src/main.jsx` so all layout-entry flows go through one normalization + engagement-tracking path.
- Updated AI recommendation apply-to-layout to reuse the shared callback before navigating into the layout editor.
- Updated quick view apply-to-layout to reuse the same shared callback, keeping bed-product normalization in one place.
- Updated the layout editor library grid and recommendation strip to call the shared handler instead of repeating `editor.addLibraryItem(...)` and `trackFurniturePlacement()` inline.
- Dropped the now-unused `trackFurniturePlacement` prop from `QuickViewModal`.

## Validation
- `git fetch --all --prune` ✅
- `npm test -- --runInBand` ✅
- `npm run build` ✅
- `BASE_REF=HEAD~1 npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_1627UTC.md`
- Revert tracked `dist/index.html` before commit to keep the checkpoint source-only. ⏳ pending before commit

## Notes
- This is a small refactor slice: behavior should stay the same while the layout-entry flows now share one app-level path.
- Gemini’s review was still somewhat stale/noisy, but it did not surface any new code-specific regressions beyond the usual tracked-build-artifact reminder.

## Next smallest checkpoint
1. Extract the layout editor’s command execution loop (`handleToolbarAction` / `handleActionButton`) into a tiny helper so `main.jsx` sheds more editor-specific branching without changing behavior.
2. If browser automation cooperates on a later run, do a direct layout-editor interaction sanity pass and checkpoint any UI-specific fixes separately.

## Branch
- `havenly/parallel-loop-2026-04-04`
