# 2026-04-08 auth header encoding checkpoint

## What changed
- encoded auth continuation headers in `vite.config.js` before writing them through the same-origin auth scaffold middleware
- decoded auth continuation headers in `src/components/auth-submit.js` when the frontend reconstructs sparse backend responses from headers
- updated focused auth-submit coverage so the header-fallback path now exercises encoded status-label headers as they would come back from the scaffold/server

## Why this matters for login/auth priority
- the action-required login path (`complete-profile`, `verify-email`) was still failing through the preview/dev scaffold even though the unit-level scaffold helper supported it
- the real bug was the middleware trying to emit Korean `statusLabel` text directly in an HTTP header, which throws in Node and collapsed those login attempts into a generic `400 Invalid auth scaffold request`
- this keeps the work tightly on the frontend↔backend auth contract: the login modal can now receive the same action-required continuation metadata from the scaffold path that the backend-shaped frontend logic already expects

## Validation
- `npm test -- --runInBand` ✅
- `npm run smoke:auth -- http://127.0.0.1:4175/github-pages-react-hello/` ✅ (action-required cases now return `200` with `complete-profile` / `verify-email` continuation metadata)
- `npm run review:gemini -- --files vite.config.js src/components/auth-submit.js src/components/auth-submit.test.js` ⚠️ attempted, but the local Gemini CLI stalled after cached-auth startup logs again and did not produce review output in this workspace

## Next smallest auth-first step
1. run the browser-backed auth smoke against the refreshed preview build so the ready-panel UI for `complete-profile` / `verify-email` is checked end to end, not just through the HTTP smoke path
2. if that passes, keep tightening the guarded login → ready-panel resume path around concrete backend follow-up actions instead of broad UI cleanup
