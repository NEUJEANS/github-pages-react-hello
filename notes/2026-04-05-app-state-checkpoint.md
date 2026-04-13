# HAVENLY parallel checkpoint — 2026-04-05 app state slice

## What changed
- Extracted a small set of `App`-level derived state helpers from `src/main.jsx` into `src/components/app-state.js`.
- Moved selected apartment lookup, AI recommendation context building, AI room reconciliation, and layout address summary formatting into pure functions.
- Added focused coverage in `src/components/app-state.test.js` for apartment lookup, recommendation context fallback behavior, room reconciliation, and layout summary formatting.
- Updated `src/main.jsx` to consume the new helper module so the top-level app flow stays a bit slimmer while preserving existing behavior.

## Validation
- `npm test` ✅
- `npm run build` ✅
- Gemini review run via `BASE_REF=origin/main ./scripts/gemini-review.sh` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0557UTC.md`
  - Useful takeaway: keep the new `app-state` helper/tests committed together and continue treating `main.jsx` as the primary regression surface.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit focused on source and notes. ✅

## Next smallest checkpoint
1. Extract another tiny app-level behavior from `main.jsx` only if it stays clearly testable and cohesive (for example wishlist toggling or shared screen-prop derivation).
2. Or switch to a browser-led integration pass around the AI → space → layout flow now that most recent work has been state extraction.

## Branch
- `havenly/parallel-loop-2026-04-04`
