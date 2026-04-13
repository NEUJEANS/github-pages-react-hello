# 2026-04-09 auth response contract preview checkpoint

## What changed
- Extended auth login and continuation preview state so the modal now shows **expected backend response keys** alongside request payload keys.
- Applied the preview to:
  - guarded login flow
  - direct login modal flow
  - action-required continuation/resume flow
- Updated smoke assertions so the login contract preview now checks for response-side fields like `resumeToken` and `nextAction`.
- Added focused view-state test coverage for the new preview shape.

## Why this helps
This is a small but useful step toward wiring the frontend to the backend auth scaffold: the UI now exposes not only what it plans to send, but also the minimum response contract the backend/scaffold is expected to return for login and `/api/auth/continue` flows.

That makes it easier to:
- line up frontend expectations with backend JSON shape
- catch contract drift earlier during scaffold/real-backend swaps
- reason about action-required blockers (`complete-profile`, `verify-email`, `confirm-merge-resolution`) without digging into source

## Validation
- `npm test -- src/components/auth-session-view-state.test.js src/components/auth-backend-scaffold.test.js src/components/auth-wiring-state.test.js`
- `node scripts/auth-login-smoke.mjs`
  - focused HTTP fallback contract checks passed
  - browser branch still falls back because the existing modal visibility timing issue remains (`.loginPanel .loginForm` wait timeout)

## Suggested next step
Prioritize the actual login/auth path wiring next:
1. connect the ready/action-required CTA submit path more directly to the scaffold/real backend response contract
2. stabilize the browser smoke around modal-open timing so auth UI regressions are caught in the browser path too
3. then start narrowing the gap between scaffold session bootstrap and a real backend session source
