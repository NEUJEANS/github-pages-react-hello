# HAVENLY parallel checkpoint — 2026-04-05 bed filter state slice

## What changed
- Extracted the bed catalog filtering/sorting derivation from `src/main.jsx` into a new pure helper: `src/components/bed-filter-state.js`.
- Preserved the existing filter behavior for search, size, color, material, fit threshold, and sort order while making the logic easier to test outside React.
- Added focused coverage in `src/components/bed-filter-state.test.js` for combined facet filtering, fit-threshold + price sorting, fit-score sorting, and the default cloned-list behavior.
- Updated `src/main.jsx` to call the helper from `React.useMemo`, trimming another chunk of list-derivation logic out of the entry file.

## Validation
- `npm test` ✅
- `npm run build` ✅
- Gemini review run via `BASE_REF=origin/main ./scripts/gemini-review.sh` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0529UTC.md`
  - Useful takeaway: keep the new bed filter helper/tests staged together as a clean checkpoint and continue treating `main.jsx` wiring as the main regression surface.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit focused on source and notes. ✅

## Next smallest checkpoint
1. Extract a small screen/view-model helper from `main.jsx` (for example address summary or wishlist toggle helpers) if it stays testable and self-contained.
2. Or switch from extraction to a direct integration check pass in the browser, since `main.jsx` is still the largest risk area after these refactors.

## Branch
- `havenly/parallel-loop-2026-04-04`
