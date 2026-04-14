# HAVENLY auth/layout checkpoint — 2026-04-14 13:01 UTC

## Slice
Continue live GitHub Pages auth/layout work from the main repo/worktree, recover the public auth tunnel, and debug the next real live failure without reading or editing unrelated app surfaces.

## Github sync safety
- confirmed `havenly-live` remained on `main`
- fetched `origin/main` earlier in-session before editing
- this slice stayed scoped to the live auth smoke harness and the layout auth panel/live backend path

## Live backend recovery
The previously used public auth host had expired:
- old URL returned `503` with `no tunnel here :(`

Recovered live backend access from the main worktree:
- standalone auth server running locally at `http://127.0.0.1:4175`
- local health check: `GET /api/auth/health` ✅
- new temporary public auth base URL: `https://b083c8642752f7.lhr.life`
- public tunnel health check: `GET https://b083c8642752f7.lhr.life/api/auth/health` ✅

Background sessions now in use:
- local auth server: `calm-ridge`
- localhost.run tunnel: `nimble-lobster`

## Coherent group edited
- `scripts/auth-login-smoke.mjs`

## What changed
### 1) Fixed live smoke query-override URL composition
The browser smoke’s query-override scenario was incorrectly appending a second `?` onto a `baseUrl` that already contained `?authApiBaseUrl=...`, corrupting the live runtime URL before the page loaded.

Added a small helper:
- `withBaseUrlQuery(url, params)`

and updated the query-override scenario to merge params safely via `URL.searchParams` instead of raw string concatenation.

## Validation performed
### Targeted checks
- `node --check ./scripts/auth-login-smoke.mjs` ✅
- public tunnel health: ✅

### Live smoke rerun after harness fix
Command:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Fb083c8642752f7.lhr.life' --require-browser
```

Result:
- progressed past the previous query-override failure
- completed these earlier stages successfully:
  - signup scenario
  - direct login scenario
  - save-draft scenario far enough to validate login + save entry flow
  - merge scenario
  - complete-profile scenario
  - verify-email scenario
  - layout tray drag scenario
- next failure moved forward to:
  - `save-draft-scenario:start`
  - timeout at `scripts/auth-login-smoke.mjs:1247`
  - waiting for `계정 저장본 불러오기` to become enabled after changing apartment context post-reload

## Debug findings on the new live failure
The current blocker is no longer auth runtime wiring. It is now the post-reload layout/account-state drift interaction in the live flow.

Observed behavior:
- after saving/reloading, the board panel can still show the saved context and saved timestamp correctly
- but after reopening `공간 정보` and selecting `래미안 포레스트 84A`, the expected drift state does **not** reliably appear in the live smoke path
- because drift is not observed, `계정 저장본 불러오기` stays disabled and the smoke times out

Relevant files already implicated by this failure:
- `src/components/layout-auth-panel-state.js`
- `src/components/layout-auth-panel-state.test.js`
- `src/main.jsx` (layout/auth state plumbing)
- `scripts/auth-login-smoke.mjs`

## Follow-up slice completed at 13:13 UTC
Focused on the live auth/layout feedback loop itself before touching more product code.

### What was verified
- The same save-draft restore-drift path passes locally from the main worktree with the current real auth proxy flow:
  - `node ./scripts/auth-login-smoke.mjs --require-browser --via-proxy --layout-save-only` ✅
- That result strongly suggests the newest blocker is no longer the core layout/account implementation in local main.

### What changed in this slice
- kept the existing grouped edit in `scripts/auth-login-smoke.mjs`
- retained the new `withBaseUrlQuery()` helper so live Pages runtime overrides merge query params safely instead of corrupting URLs with a second `?`

### Safety / deploy prep
- ran `npm run build:pages` ✅
- ran `npm run security:secrets` ✅
- kept detailed progress in notes instead of chat
- no new product-facing debug/report UI added

### Current read on the blocker
- Local proxy-backed auth/layout save→reload→apartment-switch→restore flow now passes.
- The remaining failure is most likely one of:
  1. live GitHub Pages still running without this latest smoke-harness fix, or
  2. a live-only timing issue around overlay apartment switching after reload.

### Next step
Commit the harness fix to `main`, push, and rerun the live Pages smoke against a fresh public auth tunnel so the next checkpoint is based on the deployed site rather than local parity alone.

## Notes
- Browser tool was unavailable from the OpenClaw browser server in this session, so live validation used the existing Playwright smoke path instead.
- Detailed progress stored here instead of chat per instruction.
