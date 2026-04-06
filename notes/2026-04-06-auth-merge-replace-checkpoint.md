# HAVENLY parallel checkpoint — 2026-04-06 auth merge replace path slice

## What changed
- Extended the local auth scaffold conflict contract so `POST /api/auth/login` now advertises both realistic merge-confirmation outcomes: `keep-guest` and `replace-with-account`.
- Updated the scaffold success payload so a confirmed account-first retry returns `mergedGuestDraft.mode = replaced`, which keeps the frontend/backend contract closer to a real auth merge decision instead of only one happy-path retry.
- Wired the login modal merge-conflict state with a second concrete CTA (`계정 상태로 전환`) alongside the existing keep-guest action.
- Tightened the merge-resolution status copy in the modal so the chosen retry path is visible before/after submit.
- Added focused scaffold tests to lock the two merge-confirmation outcomes before a real backend swap.

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- Gemini review capture: `ai-reviews/gemini-review-2026-04-06_1431UTC.md`
  - The CLI stalled after writing the review header/context again, but the capture file still records the changed slice and branch state for this checkpoint.

## Why this matters for auth priority
- The guarded login flow now exercises a more realistic backend decision branch instead of forcing only one merge retry outcome.
- This keeps the work tightly on login/auth wiring: modal behavior, merge handoff contract, scaffold response shape, and backend-ready retry semantics.

## Next smallest checkpoint
1. Read the scaffold `allowedMergeResolutions` back into the modal state so the UI only offers conflict actions that the backend advertises.
2. Add one browser smoke around guarded login → merge conflict → replace-with-account / keep-guest to verify both branches through the visible modal.
3. If a real backend endpoint appears, preserve this `409` + explicit retry-resolution contract while swapping only transport/config.
