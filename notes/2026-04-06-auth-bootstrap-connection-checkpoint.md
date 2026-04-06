# HAVENLY parallel checkpoint — 2026-04-06 auth bootstrap connection slice

## What changed
- Added explicit frontend auth connection headers on login submit so the backend/scaffold can see which auth endpoint, target label, credential mode, and config source the frontend believed it was using.
- Updated the Vite auth scaffold middleware to cache that connection metadata alongside the successful scaffold auth session.
- Extended `buildAuthResultSummary()` to preserve backend-returned connection metadata instead of treating it as opaque payload.
- Taught the frontend bootstrap/login success path in `src/main.jsx` to prefer backend-returned auth connection details when persisting the restored auth session.
- Added focused tests covering the new connection headers and scaffold session payload shape.

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run build` ✅
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/` ✅
- Gemini review attempted with `BASE_REF=origin/main npm run review:gemini`
  - The CLI launched and then stalled again without producing a trustworthy review artifact, so I killed it and did not keep output from this pass.

## Why this matters for login/auth priority
- Reload/bootstrap no longer has to invent a weaker `GET /api/auth/session` connection summary when the backend/scaffold already knows the original login target.
- This is a small but realistic backend-wiring step: the frontend now serializes connection intent explicitly, and the backend-shaped session contract can echo it back during bootstrap.
- It keeps the work focused on the login path: login modal submit → backend/scaffold session cache → frontend bootstrap restore with preserved auth target context.

## Next smallest checkpoint
1. Surface the bootstrapped backend connection in the auth status/notice smoke output so regressions are easier to spot automatically.
2. Let the scaffold/session contract preserve more backend-owned auth state (for example account/profile completion requirements) without depending on frontend-only summaries.
3. When the real backend exists, reuse the same connection/session shape and replace only the scaffold middleware implementation.
