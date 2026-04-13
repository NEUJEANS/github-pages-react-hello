# 2026-04-10 — auth browser override smoke stability checkpoint

## What changed
- updated `scripts/auth-login-smoke.mjs` to use the real `.accountTrigger` semantics instead of a stale `로그인 열기`-only selector
- relaxed override-flow reload waits from `networkidle` to `domcontentloaded` so preview pages with auth overrides do not hang unnecessarily
- narrowed the override browser smoke to the realistic auth-first proof: keep the default login path executable, but override the continuation endpoint and assert the ready/action-required panel carries that non-default continuation target end-to-end

## Why
The login/auth browser smoke had drifted behind the UI and was falling back to HTTP mode before it could validate the guarded login, action-required continuation, and override wiring paths. This checkpoint restores browser-level coverage for the auth modal and continuation contract without depending on unsupported custom login routes.

## Validation
- `node --check scripts/auth-login-smoke.mjs`
- `npm run smoke:auth`
- `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini -- --files scripts/auth-login-smoke.mjs`

## Gemini review
- Gemini did not flag any issue in the smoke-script change itself
- the standing architectural caution remains: keep auth glue from growing further inside `src/main.jsx`

## Next smallest auth-first step
- use the now-stable browser smoke to add one assertion that the action-required continuation endpoint survives a full reload and final submit, not just the payload preview copy
- then start extracting a thin auth orchestration layer out of `main.jsx` so the frontend/backend auth handoff wiring keeps moving without adding more root-level churn
