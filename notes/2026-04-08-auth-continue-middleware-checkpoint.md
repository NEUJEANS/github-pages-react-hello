# 2026-04-08 auth continue middleware checkpoint

## What changed
- added explicit `continueEndpoint` support to the auth runtime config so `/api/auth/continue` can be overridden the same way as login/session/pending/logout endpoints
- wired the Vite same-origin auth scaffold middleware to handle `POST /api/auth/continue` instead of only login/session/pending/logout
- hardened preview/dev request-body parsing in the scaffold middleware and aligned auth connection reconstruction so continuation requests keep their serialized backend target metadata
- extended `scripts/auth-login-smoke.mjs` to submit real action-required continuation payloads after `complete-profile` and `verify-email` login responses, proving the blocker handoff can advance through the scaffold contract
- expanded auth-config coverage so tests now assert the new continue-endpoint override path

## Why it matters
- the login modal already knew how to prepare serializable continuation payloads, but the same-origin scaffold path was still missing the actual backend-shaped `/api/auth/continue` hop
- this closes a concrete auth-first gap between frontend intent/handoff state and the backend scaffold contract
- the smoke harness now verifies not just blocker detection, but blocker submission and scaffold session advancement too

## Validation
- `npm test`
- `npm run build`
- `node --check scripts/auth-login-smoke.mjs`
- `npm run smoke:auth -- http://127.0.0.1:4187/github-pages-react-hello/`
  - HTTP scaffold path passes for direct login, guarded merge, and both action-required continuation submissions
  - browser path still falls back because the guarded-login CTA lookup is lagging behind the current UI state machine

## Gemini review
- attempted via `npm run review:gemini -- --files vite.config.js src/components/auth-config.js src/components/auth-config.test.js scripts/auth-login-smoke.mjs`
- Gemini CLI authenticated successfully but hit repeated `429 MODEL_CAPACITY_EXHAUSTED` for `gemini-3.1-pro-preview`, so no review body was produced

## Next smallest auth-first step
1. fix the browser auth smoke to reopen the guarded login path using the current UI contract instead of the outdated CTA expectation
2. once browser smoke is green again, exercise the ready-panel continuation submit flow end-to-end in Playwright for `complete-profile` and `verify-email`
3. then tighten the frontend/session copy so post-blocker success hands off to the original intent action instead of echoing the blocker label when intent scaffolds are intentionally synthetic
