# 2026-04-11 13:52 UTC — auth verification pending-state stabilization

## What changed
- added a short minimum pending dwell for the identity-verification modal state in `src/main.jsx`
- preserved the existing verified-state hold, but moved both timings behind named constants
- carried `startedAt` through the verification state so the UI can deterministically show the pending guidance before the verified copy replaces it
- reset the pending-timer ref after successful verification and on cleanup

## Why
- the proxy-backed browser smoke already exercised the real auth server + sqlite persistence, but the verification modal could transition so quickly that the pending guidance text was not always observable in the browser scenario
- this makes the end-to-end login/auth flow feel more intentional and keeps the real verification step visibly alive before completion

## Validation
- `npm test`
- `npm run smoke:auth:proxy`
- smoke result now reports `pendingGuidanceObserved: true` for the verify-email scenario
- quick no-log-ui scan: no new visible progress/report/debug/checklist/log blocks were added to the product UI

## Gemini
- `npm run review:gemini -- ./src/main.jsx`
- Gemini completed, but only produced broad branch-level feedback; no new issue called out for this checkpoint beyond ongoing `main.jsx` size concerns

## Next likely checkpoint
- pull more login/auth bootstrap logic out of `src/main.jsx` into smaller auth-specific modules/components without changing visible UI behavior
- keep validating against the real proxy-backed auth server and sqlite store after each extraction
