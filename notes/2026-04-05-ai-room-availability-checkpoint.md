# HAVENLY parallel checkpoint — 2026-04-05 AI room availability slice

## What changed
- Derived the AI room chip list from the currently linked shared space profile so the selector now reflects only rooms represented by the chosen floorplan zones.
- Kept unavailable room chips visible but disabled them with clearer affordance, instead of letting users pick rooms that are not part of the current connected profile.
- Updated the AI form sync logic so it preserves the current room when still valid, and only falls back to the profile’s primary room when the existing choice becomes unavailable.
- Added a short helper hint under the room chips to explain why some room choices may be unavailable.

## Validation
- `git fetch --all --prune` ✅
- `npm run build` ✅
- Gemini review run via `BASE_REF=origin/main ./scripts/gemini-review.sh` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-05_0227UTC.md`
  - Useful takeaway: keep the next slice focused on another isolated integration or light behavior coverage.
- Reverted regenerated `dist/index.html` before checkpointing to keep the commit source-only. ✅

## Next smallest checkpoint
1. Add a tiny isolated test harness or helper-level coverage for the shared space/AI room derivation logic.
2. If test setup still feels too large, tighten another small clarity issue in the AI/result flow without broadening app architecture.
3. Revisit whether tracked `dist/` output is intentional, but continue keeping routine loop commits source-only unless deployment policy changes.

## Branch
- `havenly/parallel-loop-2026-04-04`
