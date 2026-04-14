# HAVENLY auth/layout checkpoint — 2026-04-14 11:58 UTC

## Slice
Stop GitHub Pages from auto-probing loopback auth on every live visit, and make localhost probing an explicit opt-in only.

## Why this slice
Recent live-site testing showed the deployed app was still trying to discover a local auth server from `github.io`, but modern Chrome policies increasingly block `github.io -> localhost/127.0.0.1` access. That meant the app was burning time on a path that looked like backend progress but was usually impossible in practice.

This slice keeps the auth work honest:
- live Pages defaults to a real public backend/runtime config path
- local loopback probing is still available, but only when explicitly requested for debugging
- the login/auth/layout experience stops pretending that loopback discovery is a reliable production behavior

## Coherent group edited
- `src/components/auth-config.js`
- `src/components/auth-config.test.js`
- `src/main.jsx`
- `index.html`
- `public/havenly-auth-config.example.js`

## What changed
### 1. Explicit opt-in for loopback probing
Added `allowLoopbackProbe` support and wired it so local auth probing only runs when the user explicitly opts in.

Current opt-in path:
- query param: `?authLoopbackProbe=1`

### 2. Removed bootstrap-time live auto-probe
The runtime bootstrap in `index.html` no longer performs automatic localhost health probing on GitHub Pages page load.

### 3. Main app shell only probes when explicitly allowed
`src/main.jsx` now keeps the async detection path behind `baseAuthConfig.allowLoopbackProbe`, so the live app stays on the truthful “public backend required unless configured” path by default.

### 4. Documentation/example updated
Updated the runtime config example to document explicit loopback opt-in as a debugging-only path rather than the default Pages behavior.

## Validation
- `node --test src/components/auth-config.test.js` ✅
- `npm test` ✅
- `npm run build:pages` ✅

## Expected live effect
On the deployed GitHub Pages site:
- default visit: no automatic localhost probe, no fake implicit backend discovery path
- explicit debug visit with `?authLoopbackProbe=1`: the app may try local loopback auth detection if the browser/device/network policy still allows it
- recommended real path: use a real external auth base URL/runtime config

## Next loop
1. secret scan / safety check
2. commit + push this checkpoint to `main`
3. open the live GitHub Pages site in Chrome and verify the default auth state is clean/non-noisy
4. test explicit loopback opt-in once to confirm the fallback remains intentional rather than automatic
5. continue the next auth/layout slice based on live behavior, ideally toward a real external backend/runtime path or clearer customer-facing auth handoff
