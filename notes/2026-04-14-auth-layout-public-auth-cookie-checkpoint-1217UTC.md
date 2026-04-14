# HAVENLY auth/layout checkpoint — 2026-04-14 12:17 UTC

## Slice
Make the standalone sqlite auth backend compatible with live GitHub Pages credentialed requests, then stand it up behind a temporary public HTTPS tunnel for direct live-site validation.

## Github sync safety
- confirmed `havenly-live` is on `main`
- fetched `origin/main` before editing
- local branch started in sync with remote before this slice

## Why this slice
The earlier live feedback isolated the real blocker:
- GitHub Pages cannot call the local loopback auth server from the browser.
- A real public `authApiBaseUrl` is required.
- Even with a public host, the existing auth server was still issuing `SameSite=Lax` cookies, which would not persist a cross-site session from `https://neujeans.github.io/...` to an external auth origin.

So the next real backend step was not more frontend probing. It was browser-compatible cross-site session transport.

## Coherent group edited
- `server/auth-persistent-store.js`
- `server/auth-persistent-store.test.js`

## What changed
### 1) Request-aware cookie policy for public Pages auth
The sqlite auth store now switches cookie attributes by request context:
- live GitHub Pages origin + HTTPS public auth host → `SameSite=None; Secure`
- local preview / same-machine flows → keep `SameSite=Lax`

That preserves local preview behavior while allowing a real public auth host to maintain the auth session from the deployed Pages app.

### 2) Focused regression coverage
Added targeted tests proving:
- GitHub Pages-origin auth requests receive cross-site secure cookies
- local preview auth requests stay on lax non-secure cookies

## Validation
- `node --test server/auth-persistent-store.test.js server/auth-http-server.test.js src/components/auth-config.test.js src/components/auth-submit.test.js src/components/layout-auth-panel-state.test.js` ✅
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Public auth runtime for the next live check
Started the standalone auth server from the main repo/worktree and exposed it via a temporary localhost.run HTTPS tunnel:
- local auth server: `http://127.0.0.1:4175`
- temporary public auth base URL used for live validation: `https://c2b93f25927b8c.lhr.life`
- direct health check through tunnel: `GET /api/auth/health` ✅

## Next immediate check
1. push this slice to `origin/main`
2. open the deployed Pages app with `?authApiBaseUrl=https://c2b93f25927b8c.lhr.life`
3. test real login/session continuity and the related board save path from the live app
4. use that live result to choose the next auth/layout slice
