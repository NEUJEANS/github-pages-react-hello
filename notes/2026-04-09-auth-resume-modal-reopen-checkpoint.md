# 2026-04-09 — auth resume modal reopen checkpoint

## What changed
- kept the login modal on the login form when a persisted auth handoff is discovered during bootstrap instead of returning early and leaving the user on a closed modal state
- expanded `buildAuthResumeState()` so persisted interrupted-login resumes restore the login-mode fields (`mode`, empty signup-only fields, and serialized `accountState`) alongside the existing handoff / continuation / draftSave contract
- added focused storage coverage for the restored login-mode defaults and reran the browser auth smoke against the same-origin scaffold path

## Why this matters for login/auth priority
- interrupted login attempts are part of the core auth path, and they now reopen into a realistic resumable shell after reload rather than depending on the user to manually rediscover the pending handoff
- this keeps the frontend auth modal aligned with the persisted backend/scaffold handoff contract: handoff id, continuation, draftSave, and backend connection are all available immediately after bootstrap
- it is a small step toward a real backend handoff because the frontend no longer drops the saved login state during app startup

## Validation
- `node --test src/components/auth-storage.test.js`
- `npm run smoke:auth`

## Gemini review
- attempted with `BASE_REF=HEAD npm run review:gemini ...`, but Gemini CLI returned repeated `429 MODEL_CAPACITY_EXHAUSTED` responses in this environment, so no review output was available for this checkpoint

## Next auth-first step
- extend the auth smoke to assert the interrupted-login reload case explicitly (resume-ready modal open, preserved email / handoff / continuation preview) so this bootstrap fix stays locked in
- then keep pushing on frontend-to-backend continuation wiring rather than broad refactors
