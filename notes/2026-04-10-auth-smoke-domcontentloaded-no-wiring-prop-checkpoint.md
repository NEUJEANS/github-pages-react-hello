# 2026-04-10 — auth smoke domcontentloaded + no wiring prop checkpoint

## What changed
- switched the browser auth smoke navigations/reloads in `scripts/auth-login-smoke.mjs` from `waitUntil: 'networkidle'` to `waitUntil: 'domcontentloaded'`
- kept the existing explicit UI waits (`waitFor`, ready-card checks, modal assertions) as the real synchronization points for login/signup/continuation states
- removed the unused `authWiringState` import/memo/prop plumbing from `src/main.jsx` so the app no longer carries that debug-oriented wiring payload through the login modal path by default

## Why this matters
- the current auth-first loop depends on browser smoke staying trustworthy while real login/session/continuation wiring evolves
- `networkidle` was a likely source of false hangs in preview-browser runs because the auth shell already performs follow-up bootstrap work after navigation; `domcontentloaded` plus explicit UI waits tracks the real login UX more directly
- removing the dead wiring prop keeps the no-log-ui-defaults rule intact and reduces the chance of debug/report surfaces creeping back into product UI work

## Validation
- `npm test`
- manual browser spot-check of the login entry and guarded login modal in preview still opened correctly after the change

## Follow-up
- keep tracing the remaining browser-smoke hang if it still reproduces after this wait-strategy change; likely next place to inspect is a later explicit `waitFor` in the continuation scenarios rather than initial page navigation
- if a later blocker is confirmed, tighten the smoke harness around that specific ready-state instead of broadening visible UI diagnostics
