# HAVENLY auth/runtime-file bootstrap checkpoint — 2026-04-15 00:07 UTC

## Goal
Use the next coherent main-worktree slice to reduce dependence on `?authApiBaseUrl=` for the deployed GitHub Pages app, then validate the live site against the real sqlite-backed auth/backend path.

## Github sync safety
- worked in `/home/user1_admin/.openclaw/workspace/havenly-live`
- started from `main` after fetching earlier and confirming no remote-ahead drift
- kept this slice narrow to deploy/runtime auth wiring instead of reopening already-green auth/layout product flows

## Why this slice
A fresh public HTTPS tunnel is healthy again:
- local auth backend: `http://127.0.0.1:4175/api/auth/health` ✅
- public auth backend: `https://f2377d9f94613f.lhr.life/api/auth/health` ✅

Live validation before editing showed:
- the full deployed-site auth smoke still passes when `authApiBaseUrl` is provided explicitly
- the bare deployed Pages URL still cannot authenticate because that runtime config is not present on the live site by default

Since the real login/backend/database path is already good, the next real blocker is deployment/runtime wiring — not more modal or layout churn.

## Coherent files touched together
- `index.html`
- `public/havenly-auth-config.js`
- `scripts/sync-dist-to-docs.mjs`
- generated deploy artifacts:
  - `docs/index.html`
  - `docs/havenly-auth-config.js`
  - `docs/havenly-auth-config.example.js`
  - `docs/assets/*`

## What changed
### 1) Pages boot now loads a repo-served auth runtime file before the app starts
`index.html` now attempts to load `./havenly-auth-config.js` before importing `src/main.jsx`.

Merge order now becomes:
1. repo-served runtime file
2. localStorage runtime config
3. existing injected config
4. explicit query overrides

That keeps query params as the strongest manual override while finally giving the deployed static site a first-class same-repo runtime config file.

### 2) Added an active runtime auth file for this checkpoint
Created `public/havenly-auth-config.js` with the current fresh public auth backend:
- `https://f2377d9f94613f.lhr.life`

This is intentionally a deployment-level auth pointer, not a product-UI change.

### 3) Fixed Pages packaging so extra dist files actually ship into `docs/`
The existing `scripts/sync-dist-to-docs.mjs` only copied:
- `dist/index.html`
- `dist/assets/`

That meant any runtime deploy files from `public/` (including the new auth config file) would silently be missing from the GitHub Pages output.

Updated the sync script to also copy extra top-level dist entries into `docs/` while preserving the page markdown docs already kept there.

Without this fix, the runtime config work would have looked correct locally but never reached the deployed site.

## Validation before push
### Live baseline against current deployed site (before this deploy)
- full live browser smoke with explicit runtime override ✅
  ```bash
  node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Ff2377d9f94613f.lhr.life' --require-browser
  ```
- bare live URL without query override still failed at signup readiness, which is expected before the new deploy goes live

### Focused automated coverage
- `npm test -- --test-name-pattern='resolveAuthConfig|auth-config|auth-submit|auth-flow-state'` ✅

### Build / packaging
- `npm run build:pages` ✅
- confirmed generated deploy file exists:
  - `docs/havenly-auth-config.js` ✅

### Secret scan before upload
- `npm run security:secrets` ✅
- verified secrets: `0`
- unverified secrets: `0`

## No-log-ui check
- no product-facing debug/status/report UI was added
- all deployment/runtime notes remain in files only

## Expected effect after push + Pages refresh
The deployed bare Pages URL should now bootstrap auth against the live public backend without requiring `?authApiBaseUrl=`.

Target live retest after Pages updates:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/' --require-browser --layout-save-only
```

If that passes, the next coherent slice should move from deployment bootstrap to the next real product/backend improvement rather than more runtime scaffolding.
