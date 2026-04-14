# HAVENLY auth/layout checkpoint — 2026-04-14 10:53 UTC

## Slice
Unblock the deployed GitHub Pages app from reaching the real local standalone auth/database backend by adding explicit CORS support to the standalone auth server.

## Why this slice
After the previous Pages runtime auto-detect work, a direct Playwright check against the live site still showed:
- `window.__HAVENLY_AUTH_CONFIG__` remained `{}`
- no `/api/auth/*` requests were observed from the live page

That strongly indicated the health probe from `https://neujeans.github.io/github-pages-react-hello/` to `http://127.0.0.1:4175/api/auth/health` was still blocked at the browser boundary. The missing piece was backend CORS for the live GitHub Pages origin.

## Files touched together
- `server/auth-http-server.js`
- `server/auth-http-server.test.js`

## What changed
### 1) Added explicit CORS handling to the standalone auth server
The standalone sqlite-backed auth backend now:
- allows `https://neujeans.github.io`
- allows localhost/127.0.0.1 browser origins for local dev flows
- returns:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
  - `Access-Control-Allow-Headers: ...` with the HAVENLY auth handoff/continuation headers
- answers `OPTIONS` preflight requests with `204`
- applies CORS headers consistently to health and auth endpoints

### 2) Added server coverage
New test verifies:
- the health endpoint returns CORS headers for `https://neujeans.github.io`
- login preflight requests receive the required allow-origin / allow-headers response

## Validation
- `npm test` ✅ (242 passing)
- `npm run build:pages` ✅
- standalone auth server still starts on `http://127.0.0.1:4175`

## Live feedback before pushing this slice
A direct headless browser check against the still-deployed live site (before pushing this CORS change) reported:
- `config: {}`
- auth button state still `guest`
- no auth network hits captured

That result matches the expected pre-CORS failure mode and is the reason for this checkpoint.

## Next immediate loop step
1. commit + push this CORS slice on `main`
2. reopen the live GitHub Pages deployment with the local auth server running
3. verify the live page now auto-detects `http://127.0.0.1:4175`
4. confirm auth/session bootstrap starts hitting the sqlite-backed backend from the live site
5. only then move deeper into login/board-save/layout continuity interactions
