# HAVENLY auth slice — 2026-04-15 02:06 UTC

## Top requirement
Restore the live signup/login/backend path for the deployed bare Pages URL.

## Decision step
1. Restated requirement: get the deployed Pages app back onto a working public auth backend.
2. Smallest candidate next actions:
   - verify whether the current public auth URL is still alive
   - restore a fresh public tunnel if it expired
   - repoint the runtime auth config to the fresh URL
   - revalidate the deployed bare URL narrowly
3. Chosen action: restore a fresh public tunnel and repoint the runtime auth config to it.

## Findings
- deployed bare-URL smoke failed in `signup-scenario:start`
- live runtime auth file was still present on Pages, but it pointed to `https://f2377d9f94613f.lhr.life`
- direct health check confirmed that old public URL had expired and returned `503 no tunnel here :(`
- local sqlite auth backend at `http://127.0.0.1:4175/api/auth/health` was still healthy
- an older localhost.run tunnel process was still around, but its hostname had expired
- opened a fresh localhost.run tunnel from the main worktree session:
  - session: `amber-mist`
  - public auth base URL: `https://22274c3268fc12.lhr.life`
- fresh public health check passed:
  - `GET https://22274c3268fc12.lhr.life/api/auth/health` ✅

## Edit in progress
- update `public/havenly-auth-config.js` to point at `https://22274c3268fc12.lhr.life`

## Next narrow validation
1. rebuild Pages output so `docs/havenly-auth-config.js` matches
2. secret scan before any push
3. push only this runtime auth pointer refresh
4. after Pages updates, rerun:
   - `node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/' --require-browser --layout-save-only`
