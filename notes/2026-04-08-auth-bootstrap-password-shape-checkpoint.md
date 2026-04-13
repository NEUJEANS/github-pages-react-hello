# 2026-04-08 auth bootstrap password-shape checkpoint

## What changed
- fixed the restored login modal state shape so both `buildAuthResumeState()` and `buildAuthReadyState()` always include `password: ''`
- this prevents the frontend auth submit-plan builder from crashing on first render when bootstrapped/persisted auth state is present and it expects `password.trim()` to be safe
- tightened `scripts/auth-login-smoke.mjs` with two auth-smoke improvements:
  - fail fast with a specific stale/incomplete-build message when the app shell never renders
  - reset the scaffold auth session before each browser scenario so login-path checks do not inherit prior authenticated state
- started updating the browser smoke assumptions toward the current auth-first UX (direct login now expects the modal to close and the session notice/account label to appear)

## Validation
- `npm test -- src/components/auth-storage.test.js src/components/auth-flow-state.test.js` ✅
- manual Playwright check against fresh preview confirmed the original browser crash source before the patch: `Cannot read properties of undefined (reading 'trim')`
- after the state-shape fix + rebuild, the app shell renders again in Playwright and the login/account trigger becomes available

## Why this matters for auth priority
- this is a real login-path blocker fix, not a refactor: persisted/bootstrapped auth state could crash the app before the login modal even became usable in a real browser
- it moves the frontend one step closer to a backend-wired auth shell by keeping restored auth state structurally compatible with the same submit-plan builder used for fresh logins
- it also makes the browser auth smoke more trustworthy by clearing scaffold session leakage between scenarios and by surfacing stale-build problems explicitly instead of timing out on a missing login button

## Next smallest auth-first step
1. finish updating the browser smoke flow for the current guarded-login UX (`그래도 로그인하기` / guard prompt expectations changed after the modal work)
2. re-run `npm run smoke:auth:browser` end-to-end on a fresh preview once those selectors are aligned
3. if needed, add one tiny helper in the smoke script to open the guarded login path consistently before save-draft / merge scenarios
