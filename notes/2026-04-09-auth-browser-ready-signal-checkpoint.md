# 2026-04-09 — auth browser ready-signal checkpoint

## What changed
- hardened `scripts/auth-login-smoke.mjs` to read the visible account label from the full account trigger instead of relying on one exact span lookup
- taught the browser auth wait helper to accept authenticated UI state from the session notice title/body, the visible account label, or a visible logout control
- added richer timeout debug output so future auth-smoke failures report the account/session/login-panel state instead of only a generic timeout

## Why this matters for login/auth priority
The current auth-first loop depends on the browser smoke staying trustworthy while frontend login, guarded handoff, and backend-scaffold continuation wiring evolve. This keeps the auth smoke aligned with the real authenticated UI states the frontend already renders, so login-path regressions are easier to distinguish from smoke-harness false negatives.

## Validation
- `node --check scripts/auth-login-smoke.mjs`
- `npm run smoke:auth` ✅

## Gemini review
- attempted via `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini -- --files scripts/auth-login-smoke.mjs`
- Gemini CLI hit repeated `429 RESOURCE_EXHAUSTED` capacity errors for `gemini-3.1-pro-preview`, so no review text was produced on this run

## Next auth-first step
- now that the browser smoke completes again, return to the frontend login path itself and tighten the guarded-merge ready CTA/state so the post-merge handoff reads like a concrete backend-connected continuation instead of lingering in a generic `준비 중…` state
