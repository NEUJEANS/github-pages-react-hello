# HAVENLY auth runtime-config checkpoint — 2026-04-14

## Goal of this slice
Use the live Pages feedback from 10:42 UTC to fix the next real blocker coherently:
- stop the live GitHub Pages app from pretending same-origin `/api/auth/*` exists when no production auth backend is configured
- make the deployed app runtime-configurable for a real external auth host
- keep auth/layout-save UX explicit so the next checkpoint can focus on actual backend hookup instead of silent 404s

## Changes made
### 1) Runtime auth bootstrap in `index.html`
Added a small boot script before the Vite entry that merges auth runtime config from:
1. `localStorage['havenly.auth.runtimeConfig']`
2. existing `window.__HAVENLY_AUTH_CONFIG__`
3. query params (`authApiBaseUrl`, `authCredentials`)

That gives the live Pages build a real way to point at an external auth/API host without rebuilding.

### 2) Unconfigured GitHub Pages guard in `src/components/auth-submit.js`
Added a dedicated `unconfigured-pages` path for the live GitHub Pages host when:
- the app is under a Pages subpath,
- auth config source is still `default`, and
- no external auth API base URL is set.

Instead of blindly probing broken production auth URLs, auth reads/submits now return a structured 503-style result with:
- explicit message that Pages auth backend is not configured yet
- decorated connection info for UI/debug state
- `meta.authTransport = 'unconfigured-pages'`

### 3) Clearer auth copy in `src/components/auth-flow-state.js`
Service-error copy now distinguishes:
- generic backend/service failure
- live Pages auth not yet wired to a real external backend

### 4) Runtime-config example file
Added `public/havenly-auth-config.example.js` documenting the intended live setup:
- set `localStorage['havenly.auth.runtimeConfig']`
- or use `?authApiBaseUrl=...`

## Why this matters
This does not finish real backend auth by itself.
But it removes the misleading production failure mode and gives the deployed app a concrete runtime hook for the real auth service.

## Next logical checkpoint
1. choose or stand up the real public auth/API base URL for Pages
2. set it via runtime config
3. verify live login -> pending/continue -> board save path in the browser
4. if needed, then extend backend/database persistence behavior rather than more front-end scaffolding
