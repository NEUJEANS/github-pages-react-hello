# 2026-04-08 — Auth browser smoke resilience checkpoint

## What changed
- hardened `scripts/auth-login-smoke.mjs` so the browser auth smoke waits for real app-shell markup before looking for login/auth controls
- widened the auth-shell readiness check to accept either login, logout, or account controls once the app is mounted instead of assuming the logged-out trigger is the only valid ready signal
- added stale-base recovery for browser smoke: if an already-running preview serves an incomplete shell, the script can fall back to a fresh preview port and keep the auth smoke moving
- fixed the guarded-merge browser selector to read the ready CTA from the modal footer where the real action button renders

## Validation
- `node --check scripts/auth-login-smoke.mjs`
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/`

## Current auth-focused finding
- browser smoke now gets past the old app-shell startup failure and the guarded-merge ready step
- the next concrete blocker is deeper in the login path: the browser run still times out waiting for the `프로필 보완 제출` ready-panel CTA after submitting `profile@example.com`
- HTTP smoke still confirms the backend-shaped `complete-profile` and `verify-email` responses exist, so the remaining gap is specifically in the frontend/browser modal path

## Why this matters
- this keeps the work centered on login/auth wiring instead of broad refactors
- the smoke harness now reaches later auth states reliably enough to expose real frontend handoff gaps instead of dying on stale preview/setup noise
- that makes the next run’s auth work much tighter: inspect why the ready-panel UI does not surface the action-required CTA even though the scaffold contract is already there
