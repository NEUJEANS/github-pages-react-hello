# 2026-04-06 auth submit scaffold fallback checkpoint

## What changed
- wired `submitAuthLoginPlan()` to fall back to the local auth scaffold when the frontend is still targeting the same-origin `/api/auth/*` route and that route is missing or fetch throws
- kept configured external auth APIs unchanged so real backend wiring still uses the network path
- added focused tests for 404 fallback and thrown-fetch fallback, including merge-conflict handling through the scaffold

## Why
- the login modal / handoff / session restore flow now has a realistic success path before the real backend route exists
- this keeps the frontend auth shell moving forward without pretending that an external backend is already live

## Validation
- `npm test`
- `npm run build`
- `npm run review:gemini`
