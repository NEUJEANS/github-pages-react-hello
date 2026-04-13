# HAVENLY parallel checkpoint — 2026-04-04 priority/lifestyle controls slice

## What changed
- Exposed the AI form's structured `priority` options as editable chips in the left input column.
- Exposed `lifestyle` selections as multi-select chips with a safe fallback back to `기본` when nothing else is selected.
- Added a short inline hint explaining that these controls feed the result-side summary and AI comment immediately.
- Added light spacing/text styling so the new control group reads as part of the form instead of a bolted-on block.

## Validation
- `npm run build` ✅
- Gemini review run via `BASE_REF=origin/main ./scripts/gemini-review.sh` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-04_2356UTC.md`
  - Useful takeaway: keep `dist/` out of source-only checkpoints unless intentionally publishing.

## Next smallest checkpoint
1. Share apartment / selected-space state between AI and address overlay from one source of truth.
2. Extract AI input controls into a smaller focused component if the left panel keeps growing.
3. Add a serializable draft payload preview for later save/login handoff.

## Branch
- `havenly/parallel-loop-2026-04-04`
