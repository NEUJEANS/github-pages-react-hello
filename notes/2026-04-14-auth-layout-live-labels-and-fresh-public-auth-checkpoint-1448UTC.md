# HAVENLY auth/layout checkpoint — 2026-04-14 14:48 UTC

## Slice
Keep the work on the main repo/worktree, tighten the auth modal interaction surface in one coherent slice, then revalidate the deployed GitHub Pages site against a fresh real public auth/backend tunnel.

## Github sync safety
- worked in `havenly-live` on `main`
- fetched and compared remote before editing earlier in this loop
- pushed the modal-label slice only after local test/build/secret-scan passed
- live validation was done against the deployed Pages site after the new commit reached GitHub Pages

## Why this slice
The latest deployed live check had already proven that the continuation-intent fix was on Pages, but the next browser feedback showed a narrower issue:
- the login modal reused `로그인` / `회원가입` labels for both mode switches and submit/alternate actions
- live browser automation against the deployed site became brittle because multiple in-modal controls shared the same visible names
- at the same time, the previously used public auth tunnel had expired, so the no-query live URL could no longer reach a real backend and auth requests never started

That meant the next coherent work was:
1. reduce auth-modal selector ambiguity without widening into unrelated pages
2. restore the real live public backend path
3. re-test the deployed Pages flow with the fresh backend override

## Coherent group edited
- `src/main.jsx`
- generated Pages artifacts refreshed together via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`

## What changed
### 1) Disambiguated auth mode switch controls
Inside the login modal, the top mode-switch buttons now keep the same visible copy but expose distinct accessible names:
- `로그인 모드 선택`
- `회원가입 모드 선택`

### 2) Disambiguated lower auth actions
The footer controls now also expose distinct accessible names:
- alternate-mode button: `회원가입으로 전환` / `로그인으로 전환`
- submit button: `로그인 제출` / `회원가입 제출`

This keeps the product copy stable for users while making the real deployed modal much less ambiguous for browser-driven testing.

## Validation before push
- `npm test` ✅ (252 passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Deploy checkpoint
- commit: `f127422`
- message: `Clarify auth modal action labels`
- pushed to: `origin/main`
- confirmed deployed HTML now points to:
  - `assets/index-BNjECreu.js`

## Fresh public auth/backend recovery
The previously used public auth hosts had expired and were all returning `503`, so the deployed site needed a fresh live backend path.

### Local backend state
- local auth server still healthy at `http://127.0.0.1:4175`
- local health check returned sqlite-backed OK

### Fresh tunnel opened from the main worktree
- tunnel session: `fresh-otter`
- fresh public auth base URL: `https://5259bf0a93f8b0.lhr.life`
- public health check: `GET /api/auth/health` ✅

### Cross-site cookie compatibility rechecked
Direct signup request through the fresh tunnel from GitHub Pages origin returned:
- `Set-Cookie: havenly_auth_session=...; SameSite=None; Secure`
- `Access-Control-Allow-Origin: https://neujeans.github.io`
- `Access-Control-Allow-Credentials: true`

So the deployed Pages app has a real browser-compatible backend target again.

## Live deployed-site verification
Because the OpenClaw browser server was unavailable in this session, live verification used Playwright directly against the deployed Pages URL.

### Live URL under test
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F5259bf0a93f8b0.lhr.life#layout`

### 1) Modal labels are now cleanly targetable
Observed in the deployed site:
- mode buttons expose
  - `로그인 모드 선택`
  - `회원가입 모드 선택`
- footer buttons expose
  - `회원가입으로 전환`
  - `로그인 제출`

This confirms the pushed accessibility-label slice is live.

### 2) Real live login now reaches the backend again
Observed network responses from the deployed Pages app:
- `401 /api/auth/session` (expected initial unauthenticated read)
- `200 /api/auth/login`
- `404 /api/auth/pending`

After login, the deployed UI reached the authenticated ready state instead of the previous dead-end/no-request behavior.

### 3) Ready-state continuation entrypoint appears correctly
The live site showed:
- account label: `Havenly User`
- auth notice with preserved layout-save context
- primary ready CTA: `프로필 보완 열기`

That means the earlier complete-profile entrypoint is still present in the deployed product flow when a real public backend is available.

### 4) Complete-profile continuation succeeds live
Using the deployed site plus the fresh public auth base:
- opened `프로필 보완 열기`
- filled display name + phone
- observed `200 /api/auth/continue`
- notice advanced to `현재 단계: 프로필 준비 완료`
- primary ready CTA changed to `보드 열기`

This confirms the real GitHub Pages → public auth/backend/database → continuation flow is currently healthy for this slice.

## Evidence captured
- `playwright-artifacts/live-login-submit-fresh-tunnel.png`
- `playwright-artifacts/live-complete-profile-fresh-tunnel.png`

## Current read
The concrete blocker at the start of this loop was not the layout/account backend logic itself. It was a combination of:
- expired public auth tunnels, and
- ambiguous modal controls that made live probing brittle

With a fresh tunnel plus the modal-label cleanup, the live deployed auth/continuation path is now working again through a real backend.

## Best next slice
Stay page-scoped on Page 02 / layout-auth interactions and move to the next real product/backend boundary rather than rechecking already-green login plumbing. The strongest candidate is:
- account-board save/restore or drift-state behavior after authenticated continuation
- validated on the deployed Pages site using the same fresh public auth override
