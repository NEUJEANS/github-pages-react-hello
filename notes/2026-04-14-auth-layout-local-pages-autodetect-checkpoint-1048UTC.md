# HAVENLY auth/layout checkpoint — 2026-04-14 10:48 UTC

## Slice
Make the deployed GitHub Pages app capable of using the real sqlite-backed HAVENLY auth backend automatically when the user opens the live site from a machine already running the local auth server.

## Why this slice
The 10:42 UTC live-browser feedback showed the current blocker clearly:
- live Pages still probed same-origin `/api/auth/*`
- GitHub Pages cannot host those backend endpoints
- the app already has a real standalone auth/backend/database surface locally (`server/auth-http-server.js` + sqlite), but the live site still required manual runtime wiring

This slice closes that gap without spreading edits across unrelated screens.

## Files touched together
- `index.html`
- `public/havenly-auth-config.example.js`

## What changed
### 1) Runtime bootstrap now auto-detects a local real auth backend on GitHub Pages
The Pages bootstrap script now:
- keeps existing precedence for explicit runtime config (`localStorage`, `window.__HAVENLY_AUTH_CONFIG__`, query params)
- when no explicit auth API is configured and the app is running under a GitHub Pages subpath, probes:
  - `http://127.0.0.1:4175/api/auth/health`
  - `http://localhost:4175/api/auth/health`
- if one responds healthy, it sets `window.__HAVENLY_AUTH_CONFIG__` to that backend before the app loads
- then imports the React app only after auth config resolution is complete

Practical effect:
- if `npm run dev:auth-server` is already running on the user machine,
- the live deployed Pages app can now talk to the real sqlite-backed auth backend directly,
- without requiring manual `authApiBaseUrl` query params or DevTools/localStorage setup.

### 2) Runtime-config example updated
Documented that the live site now auto-detects the local auth server on `127.0.0.1:4175` / `localhost:4175` when available.

## Validation
- `npm test` ✅
- `npm run build:pages` ✅
- local auth server launched successfully:
  - `npm run dev:auth-server`
  - health endpoint available at `http://127.0.0.1:4175/api/auth/health`

## Next immediate loop step
1. commit this Pages auth-runtime slice on `main`
2. push to GitHub Pages
3. open the live site in a real browser with the local auth server running
4. verify that login/session reads hit the local sqlite-backed auth backend instead of 404ing on GitHub Pages
5. use that live result to choose the next auth/layout slice
