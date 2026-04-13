# HAVENLY parallel checkpoint — 2026-04-06 auth merge confirmation slice

## What changed
- Added an explicit `mergeResolution` field to the frontend login submit plan so retry attempts can carry a backend-friendly conflict decision without widening the guest draft payload itself.
- Extended the local auth scaffold to return an `allowedMergeResolution` hint on `409` merge conflicts and to accept a follow-up `keep-guest` confirmation that resolves the login successfully.
- Wired the login modal so a merge-conflict response now exposes a concrete secondary action (`현재 초안으로 계속`) instead of stopping at a dead-end error state.
- Persisted the selected merge resolution through resume state so interrupted retries can continue with the same serializable handoff context.
- Added focused tests across auth flow, auth scaffold, submit, and storage helpers to lock the retry/confirmation contract before a real backend swap.

## Validation
- `git fetch --all --prune` ✅
- `npm test -- --test-reporter=spec` ✅
- `npm run build` ✅
- `BASE_REF=HEAD~1 npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-06_1133UTC.md`
  - The review text lagged behind the exact current diff, but it still reinforced checking fallback/scaffold boundaries and logout/reset behavior.

## Why this matters for auth priority
- The login flow now handles one realistic backend-auth branch beyond simple success/failure: a merge conflict that requires an explicit user decision.
- This pushes the frontend closer to a real auth contract by proving that the serializable guest draft handoff can survive a conflict, a retry, and a confirmed resolution path.
- It also keeps the work narrowly centered on login/auth wiring rather than drifting back into unrelated refactors.

## Next smallest checkpoint
1. Route the merge-confirmation action through a slightly richer request contract (`keep-guest` vs `replace-with-account`) so the UI/backend scaffold can exercise both conflict outcomes.
2. Add one browser-level smoke for the guarded login → merge conflict → confirm-continue path.
3. If a real backend endpoint becomes available, preserve the same `409` + retry contract and swap only the transport target/config.
