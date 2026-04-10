# 2026-04-10 standalone auth dev checkpoint

## What changed
- added env-based auth store path overrides in `server/auth-persistent-store.js` so the sqlite-backed auth backend can write to an explicit database path (`HAVENLY_AUTH_SQLITE_PATH`) or data directory (`HAVENLY_AUTH_DATA_DIR`)
- added a real CLI entrypoint in `server/auth-http-server.js` with `HAVENLY_AUTH_HOST` / `HAVENLY_AUTH_PORT` and `--host` / `--port` overrides
- added `npm run dev:auth-server` and `npm run dev:auth-proxy` so the frontend can target a separately running auth backend during normal development, not just inside smoke tests
- added focused tests for the new env/path overrides and CLI option parsing

## Validation
- `node --test server/auth-persistent-store.test.js server/auth-http-server.test.js`
- `npm run smoke:auth:proxy`
- `npm run review:gemini -- server/auth-persistent-store.js server/auth-persistent-store.test.js server/auth-http-server.js server/auth-http-server.test.js package.json`

## Why this matters
- the standalone auth backend is now easier to run persistently outside the smoke harness
- frontend auth wiring can point at a stable separate backend process while still using the same sqlite-backed session/user store
- auth database state can live in an explicit path, which makes the backend usable across repeated local runs and easier to deploy in non-default working directories

## Next
- use the new standalone server workflow during the next checkpoint to push more flows onto the separate auth backend path by default
- once the backend contract settles, consider documenting the exact local runbook alongside the rest of the havenly project setup
