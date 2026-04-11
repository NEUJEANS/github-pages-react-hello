# 2026-04-11 — standalone auth verification + layout endpoints checkpoint

## What changed

- extended `server/auth-http-server.js` so the standalone sqlite-backed auth backend now serves:
  - `/api/auth/verification/start`
  - `/api/auth/verification/status`
  - `/api/auth/verification/callback`
  - `/api/auth/layout/track`
- fixed cookie bridging in the standalone HTTP server so it reads the real persistent-store cookie names (`havenly_auth_session`, `havenly_auth_handoff`) for these backend routes too.
- taught the verification callback route to accept popup-style GET query params and return a lightweight completion HTML page that posts back to the opener window instead of raw JSON.
- added focused server tests covering popup verification start → callback → verified status/session persistence and layout tracking counter writes through the standalone backend.

## Why this matters

The frontend already had popup verification + layout metric client helpers, but the real standalone auth backend still only exposed the core login/session/logout/continue routes. That meant the browser could only exercise those flows against the real backend, while verification popup work and layout telemetry silently depended on non-server fallbacks. This checkpoint closes that gap so more of the login/auth journey now works end to end against the sqlite-backed backend.

## Verification

- `node --test server/auth-http-server.test.js server/auth-persistent-store.test.js src/components/auth-submit.test.js`
- `npm run smoke:auth:proxy`

## No-log-UI check

- Re-ran the browser auth proxy smoke after the server change.
- No new visible progress/debug/report/checklist/log blocks were added to the product UI in this checkpoint.

## Next smallest auth-first step

- update the browser smoke to drive the real popup verification start/callback path (instead of only entering the manual code path) so the customer-facing verify-email UI is validated against the new standalone backend endpoints too.
