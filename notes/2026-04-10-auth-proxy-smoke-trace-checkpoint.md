# 2026-04-10 auth proxy smoke trace checkpoint

## What changed
- added stage tracing to `scripts/auth-login-smoke.mjs` so proxy-backed browser smoke runs announce which major auth scenario is in progress
- added failure/cleanup stage reporting so unattended runs can show where the standalone auth backend flow stalls instead of silently hanging

## Why
- the real frontend -> Vite preview -> proxied auth backend -> sqlite path is the current blocker for unattended end-to-end auth progress
- existing unit/server coverage passes, but the browser smoke was still hanging without showing which scenario was stuck
- this keeps the debugging surface in the smoke harness, not in the product UI, so the no-log-ui-defaults rule stays intact

## Validation
- `npm test`
- `npm run smoke:auth:proxy` now reports stage progress before the stall instead of failing silently
- `npm run review:gemini -- scripts/auth-login-smoke.mjs` (started for review loop)

## Notes
- current trace confirms the proxy-backed browser path enters the browser scenarios and gets past build/preview startup; the remaining hang is inside the browser smoke flow rather than preview boot
- `dist/index.html` was touched by the build run and should be kept or reset separately from this harness checkpoint

## Next likely step
- isolate the exact stalled scenario/action inside `auth-login-smoke.mjs` and tighten that flow until `smoke:auth:proxy` exits cleanly end to end
- once the proxy-backed browser smoke is green, keep shifting auth development toward the standalone backend path instead of the in-process scaffold
