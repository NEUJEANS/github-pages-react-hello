# 2026-04-10 — auth no-log-ui browser smoke checkpoint

## What changed
- Updated `scripts/auth-login-smoke.mjs` to follow the cleaned customer-facing auth UI instead of the older debug-style guard copy.
- Added explicit assertions that guarded login cards do **not** surface log/debug/checklist/payload-style copy in the product UI.
- Made browser smoke form filling target the visible email/password placeholders and the modal footer CTA, which matches the current auth modal structure better.
- Relaxed a couple of browser-smoke reads so they tolerate optional session-notice/muted rows while the auth UI keeps shifting.

## Validation
- `npm test` ✅
- `npm run smoke:auth` ✅ for HTTP/auth-contract flow; browser path still reports a later UI timing/assertion miss and needs another pass.
- `npm run review:gemini` ✅

## Next
- Finish stabilizing the browser smoke path around the post-login ready card / optional muted rows so the browser-required auth smoke can pass cleanly again.
