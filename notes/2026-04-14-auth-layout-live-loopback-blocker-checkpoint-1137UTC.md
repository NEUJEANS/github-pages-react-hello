# HAVENLY auth/layout checkpoint — 2026-04-14 11:37 UTC

## Slice
Tighten the live GitHub Pages auth runtime after direct browser feedback showed the local-loopback autodetect path is blocked by browser policy, then keep the auth status copy coherent with that live failure.

## Github sync safety
- confirmed `havenly-live` is on `main`
- fetched `origin/main` before editing
- local branch was in sync with remote before this slice

## Live feedback that drove this slice
A direct headless browser check against the deployed site showed the current blocker is not the sqlite auth server itself. The browser blocks the live Pages origin from reaching `http://127.0.0.1:4175` / `http://localhost:4175`:
- `Permission was denied for this request to access the loopback address space`
- the failed requests happen during the runtime auth probe from the live GitHub Pages page

That means the prior runtime autodetect idea is not sufficient for real live login from GitHub Pages, even when the local auth server is healthy.

## Coherent group edited
- `index.html`
- `src/components/auth-config.js`
- `src/components/auth-submit.js`
- `src/components/auth-flow-state.js`
- `src/main.jsx`
- focused auth tests only

## What changed
### 1) Runtime bootstrap records loopback-policy failure explicitly
The pre-app Pages bootstrap now distinguishes between:
- successful local auth autodetect
- ordinary probe miss
- browser-policy loopback denial

If the probe is blocked by loopback address-space policy, the runtime config now carries a blocker hint instead of silently looking like a generic missing backend.

### 2) Auth config preserves the blocker hint through app state
`resolveAuthConfig()` now exposes `loopbackProbeBlockedReason` so the login/session/pending/logout paths can keep the same live-runtime context instead of dropping it.

### 3) Unconfigured live auth result is now more precise
When Pages is still effectively unconfigured and the loopback probe was specifically blocked, auth reads/submits return a sharper `unconfigured-pages-loopback-blocked` transport result with a message that points to the real next step:
- use a real public `authApiBaseUrl`, or
- use a local preview/proxy path instead of live GitHub Pages for local auth

### 4) Customer-facing auth copy matches the actual blocker
The auth service copy now explains that the live Pages site cannot directly reach the local auth server from this browser, instead of implying the issue is only a generic missing backend.

## Validation
- `node --test src/components/auth-config.test.js src/components/auth-submit.test.js src/components/auth-flow-state.test.js` ✅
- `npm run build:pages` ✅
- `npm run security:secrets` ✅
- direct Playwright live check reproduced the loopback blocker against `https://neujeans.github.io/github-pages-react-hello/` ✅

## Next slice
The next real auth/backend step should stay centered on production/live connectivity rather than more local auth UI work:
1. push this checkpoint
2. verify the deployed site now surfaces the sharper live-blocker behavior
3. decide between:
   - a real public auth host for Pages via runtime `authApiBaseUrl`, or
   - treating local auth as preview/proxy-only and avoiding live loopback probing entirely
4. only after live auth connectivity exists, continue the next saved-layout/account round-trip slice
