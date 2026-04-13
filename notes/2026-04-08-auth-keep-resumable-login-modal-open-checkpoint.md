# 2026-04-08 — Auth resumable login modal checkpoint

## What changed
- Kept the login modal open after successful auth when there is a real post-auth follow-through target instead of auto-closing immediately.
- This now covers resumable login outcomes such as layout-draft save / layout checkout / guest-draft resume / account-state resume / cart checkout, not just hard blockers like `complete-profile` and `verify-email`.
- Updated the modal-close helper to consider serialized intent + backend continuation together so the frontend behaves more like an explicit handoff shell over backend auth state.

## Why
- Previously, successful auth could auto-close the modal even when the backend/frontend already knew the next realistic user action.
- That made the login handoff feel abrupt and hid the ready-panel contract the user should confirm before continuing.
- Keeping the modal open for resumable continuations is a safer step toward backend-wired auth UX because it exposes the continuation contract instead of silently jumping screens.

## Validation
- `npm test`
- `npm run build`
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/`

## Gemini review
- Attempted via `npm run review:gemini -- --files src/components/auth-intent-state.js src/components/auth-intent-state.test.js src/main.jsx`
- Gemini CLI loaded cached credentials with FileKeychain fallback, then stalled without producing a review body.
