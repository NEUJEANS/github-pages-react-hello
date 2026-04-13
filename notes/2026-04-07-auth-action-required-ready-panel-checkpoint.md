# 2026-04-07 auth action-required ready panel checkpoint

## What changed
- added `canResumePostAuthIntent()` so the authenticated ready panel only closes/navigates when the frontend actually has a real post-login screen to open
- updated the ready-panel view model to mark backend-only `complete-profile` and `verify-email` continuation steps as disabled instead of pretending they are already wired in the UI
- surfaced a small blocker note in the login modal when the backend scaffold says auth is connected but the next required screen is still missing on the frontend
- added focused coverage for both the disabled ready-panel state and the new post-auth resumability guard

## Validation
- `git fetch --all --prune` ✅ (remote branch unchanged; local branch still ahead only)
- `npm test -- src/components/auth-intent-state.test.js src/components/auth-session-view-state.test.js src/components/auth-backend-scaffold.test.js src/components/auth-submit.test.js src/components/auth-storage.test.js` ✅
- `npm run build` ✅
- Gemini review helper was run, but its current script still ignores `--files` and reviewed the whole branch diff instead of just the touched auth files; no blocking issues specific to this checkpoint were surfaced

## Why this matters for login/auth priority
- it tightens the login modal flow against a real backend contract: the frontend now distinguishes between "authenticated and resumable" versus "authenticated but still waiting on a missing profile/email-verification screen"
- it avoids a false-positive continuation path where the ready panel would close even though the backend next action was only scaffolded, which keeps the serializable handoff and session state trustworthy
- it is a small realistic step toward wiring the frontend auth shell to backend-required follow-up actions without claiming that the follow-up UIs already exist

## Next smallest checkpoint
1. add one browser smoke case that boots into a `complete-profile` or `verify-email` scaffold session and asserts the ready panel stays open with a disabled primary CTA
2. teach the scaffold/session smoke script to capture the ready-panel copy for action-required sessions alongside the existing save-draft and merge paths
3. if the follow-up screens are scoped next, start with the thinnest possible profile-completion stub route that consumes the preserved `resumeToken` and `nextAction` contract
