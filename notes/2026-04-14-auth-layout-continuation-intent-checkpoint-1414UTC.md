# HAVENLY auth/layout checkpoint — 2026-04-14 14:14 UTC

## Slice
Restore the real auth continuation intent on the main GitHub Pages worktree so `complete-profile` continuation submits keep the original post-login product/layout intent instead of collapsing to the blocker action.

## Why this slice
The latest live public-auth smoke was already reaching a real backend, persisting cross-site cookies, and advancing all the way into the `complete-profile` branch. The remaining blocker was late in the continuation handoff:
- the UI showed the account/session-ready state
- the `complete-profile` modal/CTA path was inconsistent with the intended resume flow
- `src/main.jsx` still built the continuation request from the raw session/form intent instead of the already-existing `resolveContinuationSubmitIntent(...)` helper

That meant the app could lose the pre-blocker intent during continuation submission, especially for auth-gated layout save/resume flows where the blocker action (`complete-profile`) should not replace the real target (`save-layout-draft`, `resume-layout-checkout`, etc.).

## Coherent group edited
- `src/main.jsx`
- generated Pages artifacts refreshed together via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`

This keeps the change centered on one auth-continuation wiring slice rather than scattered patches.

## What changed
### 1) Reused the continuation-intent resolver in the app shell
Added a memoized `authContinuationIntent` in `src/main.jsx` that resolves from:
- persisted session intent
- active form intent
- pending handoff intent
- current blocker action

### 2) Continuation submit plan now uses the resolved intent
The continuation plan now sends `authContinuationIntent` instead of the raw serialized session/form intent.

### 3) Draft-save attachment follows the resolved continuation intent too
`shouldAttachDraftSaveToAuthContinuation(...)` now also receives the resolved continuation intent, so layout-save payloads stay attached when the real target is a saved-layout follow-through and the current blocker is only `complete-profile`.

## Validation
- `npm run security:secrets` ✅
- `npm test` ✅ (252 passing)
- `npm run build:pages` ✅

## Expected live effect
On the deployed Pages site, late auth continuation flows should preserve the original post-login resume target after `complete-profile` instead of degrading into blocker-only behavior. This should make the live auth/layout handoff more consistent for real saved-layout and related resume paths.

## Next loop
1. commit and push this slice on `main`
2. wait for GitHub Pages to update
3. test the live site in Chrome/browser
4. if `complete-profile` still fails, inspect whether the remaining issue is:
   - product UI state exposure, or
   - stale smoke/browser expectation
5. keep the next slice confined to that exact boundary
