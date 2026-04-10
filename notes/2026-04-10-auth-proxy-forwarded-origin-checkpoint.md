# Auth proxy forwarded origin checkpoint

## What changed
- preserved the preview host/protocol when Vite proxies auth requests into the standalone auth HTTP server
- updated the auth HTTP server to build `/api/auth/continue` metadata from forwarded origin headers instead of the internal server port
- added a regression test that proves proxied signup responses advertise the preview origin for continuation wiring

## Why
- the standalone auth server was returning `actionConnection.resolvedUrl` values pointing at its own ephemeral port instead of the preview/proxy origin
- that leaked internal backend wiring into the frontend session contract and made proxied end-to-end auth continuation metadata less trustworthy

## Verification
- `npm test`
- `./scripts/gemini-review.sh`

## Follow-up
- finish debugging the browser-only proxy signup resume failure in `npm run smoke:auth:proxy`; HTTP-level proxy signup + continue already succeeds, so the remaining issue appears to be in the browser/UI path rather than the backend contract itself
