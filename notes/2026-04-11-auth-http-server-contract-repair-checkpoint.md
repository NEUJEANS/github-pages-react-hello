# 2026-04-11 — auth http server contract repair checkpoint

## What changed
- repaired `server/auth-http-server.js` after the file had been overwritten by a Gemini review artifact instead of executable server code
- restored a working standalone auth HTTP server implementation backed by the sqlite persistent store
- aligned the HTTP server contract with current tests and frontend expectations:
  - health endpoint now reports `service`, `storage`, and `sqlitePath`
  - forwarded `x-forwarded-host` / `x-forwarded-proto` now shape `actionConnection` for real continuation URLs
  - server now forwards persistent-store cookies directly (`havenly_auth_session`, `havenly_auth_handoff`) instead of inventing parallel cookie names
  - exposed `resolveAuthHttpServerOptions()` for CLI/config resolution tests
  - preserved continuation/auth connection headers on responses

## Verification
- `npm test`
- `npm run smoke:auth`
- `./scripts/gemini-review.sh`

## No-log-UI check
- browser auth smoke still asserts that login/guard/ready UI does not expose debug/log/checklist/payload wiring copy
- smoke passed after the server repair, so the UI remained free of visible progress/debug blocks
