# 2026-04-08 auth blocker-only resume checkpoint

## What changed
- taught the local auth scaffold to resolve completed `complete-profile` / `verify-email` blocker-only flows back to `resume-authenticated-flow` instead of echoing the blocker action forever
- kept the existing behavior for richer intents (for example `save-layout-draft`) so post-auth resume still returns to the concrete downstream action when one exists
- extended `auth-backend-scaffold.test.js` with blocker-only completion cases for both profile completion and email verification
- extended `scripts/auth-login-smoke.mjs` to probe reload/bootstrap behavior for action-required flows and to capture the serialized continuation fields after reload

## Why it matters
- this is a small but real backend-connection step: once the blocker payload is accepted, the scaffold now hands the frontend back a resumable authenticated target instead of leaving it stranded on the blocker action
- that makes the login modal continuation path more realistic for future backend wiring, especially when the auth blocker itself was the primary intent rather than a sub-step of save/checkout
- the updated smoke harness is now aimed directly at the blocker/bootstrap path the branch is prioritizing

## Validation
- `npm test`
- `npm run build`
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/`

## Current auth-focused finding
- HTTP smoke now shows blocker continuations returning `resume-authenticated-flow` after successful profile/email completion
- browser smoke is still flaky in this environment and falls back to HTTP, so the next useful auth-first run should keep pushing on real browser verification of the reloaded action-required modal path

## Gemini review
- attempted via `npm run review:gemini -- --files src/components/auth-backend-scaffold.js src/components/auth-backend-scaffold.test.js scripts/auth-login-smoke.mjs`
- if Gemini stalls again, keep the checkpoint and continue from the browser-smoke gap on the next run rather than blocking this branch on the review tool
