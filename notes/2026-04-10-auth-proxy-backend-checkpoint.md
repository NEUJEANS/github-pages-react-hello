# 2026-04-10 auth proxy backend checkpoint

## What changed
- added `server/auth-http-server.js`, a small standalone HTTP wrapper around the existing sqlite-backed auth store so auth can run as a separate backend process
- added `server/auth-http-server.test.js` to verify signup/login/session cookie flow and merge-blocker continuation headers over real HTTP
- extended `scripts/auth-login-smoke.mjs` with `--via-proxy` so the existing auth smoke can boot a separate auth backend and point Vite preview at it with `HAVENLY_AUTH_PROXY_BASE_URL`
- added `npm run smoke:auth:proxy` as the explicit frontend -> proxied backend -> sqlite smoke entrypoint

## Why
This narrows the gap between the in-process scaffold and a real deployable auth path. The frontend can now run against a separate auth server process while preserving the same request/response contract, cookie session handling, and sqlite persistence.

## Validation
- `node --test server/auth-persistent-store.test.js server/auth-http-server.test.js src/components/auth-submit.test.js`
- `npm run review:gemini -- server/auth-http-server.js server/auth-http-server.test.js scripts/auth-login-smoke.mjs package.json`

## Notes
- I did not add any new visible debug/progress/report/payload UI. The product auth UI remains customer-facing only.
- `smoke:auth:proxy` currently boots the browser path but still needs another pass for reliable unattended completion in this environment; the new HTTP-level coverage and proxyable backend server are the safe checkpoint from this run.

## Next likely step
- make the proxy-backed browser smoke complete reliably end to end, then assert the same continuation/login flows while Vite is forwarding `/api/auth/*` to the standalone auth server
- after that, keep moving backend auth responsibilities out of the preview middleware and into the standalone server by default for dev auth work
