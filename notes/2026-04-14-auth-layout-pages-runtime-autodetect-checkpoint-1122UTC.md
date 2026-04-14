# HAVENLY auth/layout checkpoint — 2026-04-14 11:22 UTC

## Slice
Restore real auth/backend progress on the deployed GitHub Pages app by adding runtime autodetection for the local standalone auth backend instead of leaving live Pages in permanent `unconfigured-pages` mode.

## Why this slice
Live smoke feedback after the previous backend/CORS checkpoint still failed before authenticated UI became ready. The key signal was that the frontend kept behaving like GitHub Pages had no auth backend configured, which means the live app was not actually adopting a runtime `authApiBaseUrl` even when the local auth server was available.

## Coherent group edited
- `src/components/auth-config.js`
- `src/components/auth-config.test.js`
- `src/main.jsx`

This keeps the change centered on runtime auth configuration + validation, without scattering edits into unrelated editor or product UI files.

## What changed
### 1. Live Pages loopback auth probe
Added a GitHub-Pages-specific runtime probe that:
- only activates for default, unconfigured GitHub Pages subpath deploys
- checks the local standalone auth server health on loopback candidates
- adopts `http://127.0.0.1:4175` (or localhost fallback) as runtime `apiBaseUrl` when the health endpoint confirms the sqlite-backed auth backend is up

### 2. Runtime auth config state in the app shell
The main app now:
- starts from the base resolved auth config
- asynchronously upgrades to the detected loopback runtime auth config when available
- reuses the detected config for login/session/pending/continue/logout flows

### 3. Contract coverage
Added focused tests for:
- when loopback probing should/should not run
- successful detection of the local standalone auth backend
- preserving GitHub Pages current origin in resolved auth config

## Validation
- `npm test` ✅ (244 passing)
- `npm run build:pages` ✅

## Expected effect on the next live check
When the local standalone auth server is running on `127.0.0.1:4175`, the deployed GitHub Pages app should now self-wire to that backend instead of remaining in the frontend-only unconfigured fallback state.

## Next loop
1. run secret scan
2. commit/push runtime autodetect slice on `main`
3. re-run live auth smoke against GitHub Pages with the local auth server up
4. if auth now connects, continue into a real login + saved layout round-trip on the live site
5. if it still fails, capture the exact browser/network failure and keep the next slice centered on that boundary only
