# HAVENLY parallel checkpoint — 2026-04-06 auth login smoke slice

## What changed
- Added `scripts/auth-login-smoke.mjs` as a focused Playwright smoke for the current auth priority path.
- The smoke covers two realistic frontend/backend-scaffold flows:
  - direct login success through the login modal
  - guarded cart-driven login that hits the merge-conflict scaffold path and confirms `keep-guest`
- Added `npm run smoke:auth` so the branch has one repeatable command for browser-level auth verification instead of relying only on unit tests.

## Verification
- `npm test` ✅
- `npm run smoke:auth -- http://127.0.0.1:4173/github-pages-react-hello/` ⚠️ failed in this workspace because the local `node_modules` set does not currently include the `playwright` package even though the repo declares it in `package.json`
- `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini` ⚠️ created `ai-reviews/gemini-review-2026-04-06_1602UTC.md`, but Gemini again stopped after startup/cached-auth logs without producing review text

## Why this matters for auth priority
- This keeps the work pointed at the login/auth path rather than broad refactors.
- The branch now has a concrete browser smoke aimed at the exact modal + guarded-handoff + scaffold-merge behavior we have been building.
- Once Playwright is installed in the local environment or CI, the auth flow can be checked end-to-end quickly against the same-origin scaffold or a configured backend target.

## Follow-ups
1. Restore/install the declared Playwright dependency in this working copy so `npm run smoke:auth` can execute locally.
2. If the backend scaffold expands, extend this smoke with one external-auth-base-url case so the configured network path is exercised too.
3. Consider capturing the smoke output JSON and screenshots in CI artifacts once browser tooling is available in automation.
