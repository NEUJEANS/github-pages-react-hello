# 2026-04-08 auth action-required modal resume checkpoint

## What changed
- added `shouldAutoOpenAuthReadyPanel()` so bootstrapped authenticated sessions reopen the login modal automatically when backend continuation state is still blocked on `complete-profile` or `verify-email`
- wired the app shell to use that helper, so scaffold-backed action-required sessions no longer hide behind the header button after refresh/bootstrap
- added an auth notice CTA that jumps straight back into the login modal ready panel for auth follow-through work
- covered the new auto-open decision logic in `auth-session-view-state.test.js`

## Why it matters
- this keeps the auth/login work focused on realistic backend handoff behavior instead of generic cleanup
- once the scaffold/session bootstrap says the account is authenticated but still needs extra work, the frontend now treats that as an active continuation instead of a passive notice
- that is a smaller but real step toward wiring frontend auth to backend state: the modal becomes the explicit continuation surface for backend `nextAction` blockers

## Validation
- `npm test`
- `npm run build`

## Gemini review
- attempted via `npm run review:gemini -- --files src/components/auth-session-view-state.js src/components/auth-session-view-state.test.js src/main.jsx`
- Gemini CLI again loaded cached credentials with FileKeychain fallback, then stalled without producing a review body

## Next auth-first step
- extend browser smoke/assertions to verify that a bootstrapped `complete-profile` / `verify-email` scaffold session reopens the modal and exposes the continuation CTA without manual header interaction
- then tighten the ready-panel submit path around those action-required responses if the browser smoke finds any mismatch
