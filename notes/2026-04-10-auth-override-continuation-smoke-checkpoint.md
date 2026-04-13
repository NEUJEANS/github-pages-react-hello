# 2026-04-10 — auth override continuation smoke checkpoint

## What changed
- extended `scripts/auth-login-smoke.mjs` with a continuation-payload preview reader for action-required auth states
- taught the smoke flow to assert non-default `authContinueEndpoint` wiring end-to-end for both query-param and runtime-config overrides
- verified the override path on real action-required states (`complete-profile` and `verify-email`), not just the initial login panel copy

## Why
The frontend already exposed configurable login/continue endpoints, but the browser smoke only proved the overridden login endpoint showed up before submit. This checkpoint pushes one step closer to real frontend↔backend auth hookup by confirming that action-required continuation flows reuse the same overridden backend contract after the first login succeeds.

## Validation
- `node --check scripts/auth-login-smoke.mjs`
- `node --test src/components/auth-session-view-state.test.js src/components/auth-flow-state.test.js src/components/auth-submit.test.js`
- `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini -- --files scripts/auth-login-smoke.mjs`

## Gemini review
- review completed successfully for `scripts/auth-login-smoke.mjs`
- main suggestion stayed the same: keep chipping logic out of `src/main.jsx`, but no auth-contract issue was flagged in this smoke-script change

## Small next auth-first step
- run the full browser smoke against preview again and capture a passing artifact for these continuation-endpoint override assertions
- then wire one backend-configured action-required path all the way through submit/response on a non-default continuation endpoint, so the frontend proves both preview and actual continuation submission against the same override contract
