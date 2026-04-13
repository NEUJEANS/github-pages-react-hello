# 2026-04-10 auth vite proxy checkpoint

## What changed
- Added optional Vite auth proxy support in `vite.config.js`.
- When `HAVENLY_AUTH_PROXY_BASE_URL` or `VITE_AUTH_PROXY_BASE_URL` is set, the local `/api/auth/*` middleware now forwards auth requests to that backend instead of always serving the local scaffold.
- Default behavior is unchanged: without a proxy base URL, the existing same-origin auth scaffold continues to handle login/signup/session/pending/continue/logout.

## Why
- This is the smallest safe step toward wiring the frontend auth flow to a real backend while preserving the current scaffold-first development loop.
- It keeps the existing login modal / guarded auth / continuation flow intact, but allows same-origin dev and preview environments to route auth through an external backend when needed.

## Validation
- `node --test src/components/auth-*.test.js src/components/login-guard.test.js`
- `npm run build`

## Next likely step
- Add a focused smoke scenario that runs the login flow with a configured auth proxy base URL so backend passthrough wiring is exercised, not just the local scaffold.
