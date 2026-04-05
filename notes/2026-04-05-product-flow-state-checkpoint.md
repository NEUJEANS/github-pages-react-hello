# HAVENLY parallel checkpoint — 2026-04-05 product flow state helpers

## What changed
- Extracted small product-flow decisions from `src/main.jsx` into `src/components/product-flow-state.js`.
- Centralized three behaviors there: search-result pick mode (`quickView` vs `cart`), canonical quick-view product resolution for beds, and layout-editor product normalization when applying from quick view.
- Added focused Node-test coverage in `src/components/product-flow-state.test.js` for all three behaviors.
- Updated `src/main.jsx` to consume the helper module so product routing is easier to follow and safer to refactor later.

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- `BASE_REF=HEAD npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0827UTC.md`
  - Useful takeaway: keep the helper/tests committed together and continue excluding routine `dist/` regeneration from source-only checkpoints.
- Dev-server smoke check via local HTTP 200 on Vite preview URL ✅
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit source-only. ✅

## Next smallest checkpoint
1. Extract one more tiny commerce/search interaction helper from `src/main.jsx` only if it stays purely behavioral and testable.
2. Or do a focused integration pass on search → quick view → layout to verify the now-split helper flow still feels coherent in the UI.
3. If browser tooling remains unavailable, keep using source-level/test-driven slices plus lightweight local smoke checks until it recovers.

## Branch
- `havenly/parallel-loop-2026-04-04`
