# HAVENLY parallel checkpoint — 2026-04-06 auth restore summary slice

## What changed
- Extended the frontend auth result adapter to read more of the backend-shaped login response without widening the request contract: merge mode, restored wishlist/cart/layout counts, and recommendation-draft restore state now flow through `buildAuthResultSummary`.
- Persisted that richer post-login auth summary into local storage so the shell keeps a concrete record of what the backend says it restored after login.
- Updated the login modal’s ready-state summary card to surface merge status plus restored draft counts, which makes the guarded login/handoff path feel more concretely wired to a backend scaffold.
- Kept the change small and focused on the login/auth path rather than general refactoring.

## Validation
- `git fetch --all --prune` ✅
- `npm test -- --test-reporter=spec` ✅
- `npm run build` ✅
- Gemini review via `BASE_REF=origin/main npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-06_0801UTC.md`
  - Useful takeaway: pause large extractions and keep checking integrated boot/auth paths.
- Manual browser smoke on the login modal ✅
  - The modal opens, enables submit when credentials are filled, and surfaces backend/scaffold error text in-state.
  - Current follow-up: without an auth backend configured, the app shows the expected scaffold failure copy; next auth slice should tighten endpoint/config handling for deployed base-path environments.

## Next smallest checkpoint
1. Add a tiny auth-config helper so the login endpoint can be overridden cleanly for base-path deploys and external backend scaffolds.
2. Surface a slightly more specific frontend message when the auth target is still the placeholder scaffold and no backend is reachable.
3. If a backend stub lands, connect the restored-count summary to a concrete response shape and reflect it in the authenticated shell/header.

## Branch
- `havenly/parallel-loop-2026-04-04`
