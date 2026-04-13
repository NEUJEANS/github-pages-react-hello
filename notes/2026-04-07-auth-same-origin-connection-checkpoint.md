# 2026-04-07 auth same-origin connection checkpoint

## What changed
- Added `currentOrigin` to the auth runtime config so the frontend can distinguish same-origin scaffold auth from a genuinely external API host.
- Updated auth connection summary logic to keep `/api/auth/*` endpoints canonical even when they are resolved through an absolute same-origin `apiBaseUrl`.
- Updated auth submit connection fallback parsing so scaffold responses preserve the absolute resolved URL instead of collapsing back to a relative endpoint.
- Added focused coverage for same-origin vs external auth target detection in both storage and submit tests.

## Why it matters
The login modal and persisted auth session metadata were treating absolute same-origin scaffold requests like an external backend. That skewed the connection summary shown in the login flow and made the stored auth wiring less trustworthy for the next frontend/backend handoff steps.

## Validation
- `npm test -- --runInBand`
- `node ./scripts/auth-login-smoke.mjs http://127.0.0.1:4173/github-pages-react-hello/`
- `npm run review:gemini -- --files src/components/auth-config.js src/components/auth-storage.js src/components/auth-submit.js src/components/auth-config.test.js src/components/auth-storage.test.js src/components/auth-submit.test.js`

## Next likely step
Use the canonical same-origin connection metadata inside the actual browser flow to verify the login modal, persisted session banner, and pending-handoff resume path all report the scaffold target consistently when `apiBaseUrl` points back at the app origin.
