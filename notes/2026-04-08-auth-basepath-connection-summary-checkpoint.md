# 2026-04-08 auth base-path connection summary checkpoint

## What changed
- taught `buildAuthConnectionSummary()` to honor `appBasePath` and `currentOrigin` when resolving frontend auth connection metadata
- same-origin auth scaffold targets under the GitHub Pages subpath now stay canonical instead of being mislabeled as external hosts
- added focused coverage in `auth-storage.test.js` for both relative and absolute same-origin `/github-pages-react-hello/api/auth/*` targets

## Why it matters
- this is a small but real backend-auth wiring step: persisted handoff/session connection metadata now matches the actual auth endpoint shape the frontend uses under subpath deploys
- the login modal, ready panel, and saved auth session contract can now carry a correct same-origin scaffold label while the backend scaffold remains mounted under the app base path
- that keeps future frontend-to-backend auth handoff work aligned with the deployment path instead of drifting back to bare `/api/auth/*` assumptions

## Validation
- `npm test`
- `npm run build`
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/`

## Current auth-focused finding
- HTTP smoke now reports same-origin scaffold login targets under `http://127.0.0.1:4174/github-pages-react-hello/api/auth/*`, which is the path shape this branch should keep carrying into persisted auth handoffs/sessions
- browser smoke still falls back in this environment because the direct-login notice assertion times out, so the next auth-first run should inspect that browser-specific post-login rendering gap instead of the transport contract

## Gemini review
- attempted via `npm run review:gemini`
- Gemini CLI loaded cached credentials with FileKeychain fallback, then stalled without emitting a review body, so the checkpoint was kept without blocking on review output
