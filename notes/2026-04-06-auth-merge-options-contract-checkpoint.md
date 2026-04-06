# HAVENLY parallel checkpoint — 2026-04-06 auth merge-options contract slice

## What changed
- Read `allowedMergeResolution` / `allowedMergeResolutions` from backend-shaped `409` auth responses in `src/components/auth-flow-state.js` and normalized them into a deduped allow-list.
- Updated the login modal in `src/main.jsx` so merge-conflict retry buttons now render only the actions the backend scaffold explicitly advertises, instead of always hardcoding both choices.
- Tightened the in-modal merge copy for the `replace-with-account` branch and added a small empty-options fallback message so the UI does not silently look broken if a scaffold/backend returns a merge conflict without usable actions.
- Added focused coverage in `src/components/auth-flow-state.test.js` for singular/plural backend fields plus de-duplication.

## Validation
- `npm test -- --runInBand`
- `npm run build`
- Gemini diff review: contract wiring looks good; main caution was the empty-options dead-end, which this slice now surfaces explicitly in the modal.

## Why this matters
- This keeps the auth work moving toward a real backend contract instead of leaving the login modal hardwired to local assumptions.
- When the backend/auth scaffold changes which merge resolutions are available, the frontend now follows that response shape directly.

## Next likely slices
1. Let the scaffold/backend return a visible non-empty `accountState` demo for the `replace-with-account` path so the frontend visibly hydrates account-first state after login.
2. Add one browser smoke for guarded login → merge conflict → backend-advertised actions to verify the visible modal path, not just unit helpers.
3. Move the login submit + post-auth continuity patch into a small hook/helper so future backend swap work touches less of `main.jsx`.
