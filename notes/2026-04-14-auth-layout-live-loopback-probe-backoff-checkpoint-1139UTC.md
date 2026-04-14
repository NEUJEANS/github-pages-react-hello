# HAVENLY auth/layout checkpoint — 2026-04-14 11:39 UTC

## Slice
Stop the app from repeating the same blocked loopback auth probe after the runtime bootstrap has already learned that GitHub Pages cannot reach the local auth server in this browser.

## Why this follow-up was necessary
After the first blocker-clarification push, a direct live browser check still showed duplicate failed requests:
- `http://127.0.0.1:4175/api/auth/health`
- `http://localhost:4175/api/auth/health`
- then the same pair again

The second pair came from the React-side auth autodetect effect re-running even though the bootstrap had already recorded `loopback-address-space-denied`.

## Coherent group edited
- `src/main.jsx`
- regenerated `docs/` deploy assets

## What changed
The React auth runtime bootstrap effect now exits immediately when the base auth config already carries `loopbackProbeBlockedReason`.

That keeps the live GitHub Pages app from re-probing the same blocked loopback endpoints after the initial runtime bootstrap has already established that the browser policy forbids the connection.

## Validation
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Expected live effect
On the deployed GitHub Pages site, the browser should now emit only the initial bootstrap loopback probe attempts rather than repeating them from the React layer.
