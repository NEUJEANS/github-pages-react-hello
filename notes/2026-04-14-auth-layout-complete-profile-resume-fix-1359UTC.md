# HAVENLY auth/layout checkpoint — 2026-04-14 13:59 UTC

## Slice
Complete-profile continuation resume correctness for live GitHub Pages auth flows.

## Why this slice
Live Pages auth smoke had progressed far enough that the next real backend/auth continuity issue was no longer wiring or cookies. The complete-profile blocker UI appeared and submitted, but the resumed session notice could still remain stuck on `현재 단계: 프로필 보완 필요`, which meant the post-blocker intent restoration path was not reliably leaving the blocker state.

## Relevant files grouped together
- `src/components/auth-flow-state.js`
- `src/components/auth-flow-state.test.js`
- `src/main.jsx`
- `scripts/auth-login-smoke.mjs`
- generated Pages bundle (`docs/index.html`, `docs/assets/*`)

## Root cause
On continuation submit, the client resolved the next intent with this precedence:
- `currentAuthSession.intent`
- `loginForm.intent`
- `currentHandoff.summary.intent`

When the stored session intent itself had already been narrowed to the blocker action (`complete-profile`), the continuation request could reuse that blocker intent instead of restoring the pre-blocker product intent or falling back to the generic authenticated flow. That allowed the backend to keep returning a blocker-flavored continuation after profile submission.

## Fix
Added a focused intent resolver for continuation submits:
- new helper: `resolveContinuationSubmitIntent(...)`
- prefers a non-blocker intent when one exists (for example `save-layout-draft`)
- drops blocker-only intents entirely when no real post-blocker action exists, allowing the backend to fall back to `resume-authenticated-flow`

Then wired `handleAuthContinuationSubmit()` to use that helper rather than blindly reusing the stored session intent.

## Guardrail added
Updated `scripts/auth-login-smoke.mjs` so the complete-profile scenario now fails if the post-submit ready signal still contains `프로필 보완 필요`. This makes the exact regression visible in live smoke instead of silently passing.

## Validation completed before push
- `npm test` ✅ (`252` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Next live verification after push
Re-run the live Pages smoke against a fresh public auth tunnel and confirm:
1. complete-profile submit no longer leaves the resumed notice in blocker state
2. live auth/layout flows still pass end-to-end
3. use the deployed result to pick the next auth/layout checkpoint
