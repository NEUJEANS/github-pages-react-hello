# 2026-04-09 — auth connection drift checkpoint

## What changed
- Added auth-connection drift helpers so resumed login handoffs can detect more than just URL changes.
- The login modal now warns when the saved handoff/session was created with a different auth target, endpoint, credentials mode, or config source than the current frontend wiring.
- Added focused tests covering drift detection and the user-facing change summary.

## Why
When auth wiring moves from same-origin scaffold to a runtime/query-configured backend (or just changes credential mode), the existing resume copy was too narrow. It only compared resolved URLs, which could hide meaningful drift during backend hookup work.

## Validation
- `node --test src/components/auth-storage.test.js`
- `npm run build`
- `BASE_REF=origin/main npm run review:gemini`

## Small next step
- Use the new drift summary to decide whether action-required resume flows should keep the old saved connection contract or explicitly rebase to the active backend auth target before submit.
