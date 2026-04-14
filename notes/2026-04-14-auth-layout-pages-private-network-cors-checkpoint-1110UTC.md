# HAVENLY auth/layout checkpoint — 2026-04-14 11:10 UTC

## Slice
Finish the standalone auth backend CORS/browser-access slice for the main `havenly-live` repo so the deployed GitHub Pages app can talk to the real local auth/database backend from a live browser session.

## Why this slice
The previous live Pages checkpoint showed the deployed site still was not reaching the local standalone auth backend even after runtime autodetect and standard CORS work. One likely remaining browser boundary for a secure public origin (`https://neujeans.github.io`) calling a loopback HTTP backend (`http://127.0.0.1:4175`) is Private Network Access preflight handling.

## Files grouped and touched together
- `server/auth-http-server.js`
- `server/auth-http-server.test.js`

Grouping stayed coherent to one backend/browser-boundary slice instead of scattering auth and layout changes across unrelated frontend files.

## What changed
### Private Network Access preflight support
The standalone auth server now:
- detects `Access-Control-Request-Private-Network: true`
- allows loopback-host requests to advertise private-network access
- returns `Access-Control-Allow-Private-Network: true` when needed
- expands `Vary` to include `Access-Control-Request-Private-Network`

### Contract coverage
The auth server test suite now verifies that the live GitHub Pages preflight path receives:
- `204`
- `Access-Control-Allow-Origin: https://neujeans.github.io`
- `Access-Control-Allow-Private-Network: true`
- expected auth continuation headers in `Access-Control-Allow-Headers`

## Validation
- `npm test` ✅ (242 passing)
- `npm run build:pages` ✅

## Expected effect on the next live check
With the standalone auth server running locally, the deployed GitHub Pages app should have a better chance of successfully probing and using `http://127.0.0.1:4175/api/auth/*` from Chrome instead of silently staying on same-origin `/api/auth/*` paths.

## Next loop
1. secret scan
2. commit/push this backend slice on `main`
3. start the local auth server if needed
4. open the live Pages deployment in Chrome/browser
5. verify whether auth/session/bootstrap requests now hit `127.0.0.1:4175`
6. if yes, continue into real login + layout save/restore interaction on the live site
7. if no, inspect the exact browser failure and adjust the next grouped slice accordingly
