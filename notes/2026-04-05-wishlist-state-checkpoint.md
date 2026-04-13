# HAVENLY parallel checkpoint — 2026-04-05 wishlist state slice

## What changed
- Extracted the bed wishlist toggle logic from `src/main.jsx` into `src/components/wishlist-state.js`.
- Added focused coverage in `src/components/wishlist-state.test.js` for add, remove, and non-mutation behavior.
- Updated `src/main.jsx` to call the helper so the beds screen wiring stays the same while trimming another inline state transition.

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- Local HTTP smoke check via Vite dev server + `curl` ✅
- Gemini review run via `BASE_REF=HEAD~1 ./scripts/gemini-review.sh` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0626UTC.md`
  - Useful takeaway: keep the wishlist helper/test slice atomic and continue leaving generated `dist/` artifacts out of focused source checkpoints.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit source-only. ✅

## Next smallest checkpoint
1. Extract another tiny pure helper from `main.jsx` only if it reduces inline state transitions without dragging UI code along.
2. Or switch back to a browser-led integration pass around the AI → beds → quick-view flow once browser tooling is available again.

## Branch
- `havenly/parallel-loop-2026-04-04`
