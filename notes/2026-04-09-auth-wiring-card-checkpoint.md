# 2026-04-09 auth wiring card checkpoint

## What changed
- Added `buildAuthWiringState` to derive the canonical frontend→backend auth wiring map from the current auth config.
- Rendered a compact auth wiring card inside the login modal and ready/resume panel so login, signup, session, pending, continue, and logout endpoints are visible during auth handoff work.
- Covered same-origin base-path and remote API-base resolution with focused unit tests.

## Why
- The next auth steps are backend-connection work, so the UI now exposes the exact endpoint contract the frontend believes it is targeting.
- This makes it easier to wire the real backend scaffold without guessing which endpoint/source/credentials combination is active.

## Validation
- `npm test -- --test-reporter=spec`
- `npm run build`
- `npm run smoke:auth`

## Next smallest step
- Use the exposed wiring map to connect the action-required continuation forms (`complete-profile`, `verify-email`, `confirm-merge-resolution`) to a real backend scaffold or proxy response contract, then smoke-test one remote-configured target path.
