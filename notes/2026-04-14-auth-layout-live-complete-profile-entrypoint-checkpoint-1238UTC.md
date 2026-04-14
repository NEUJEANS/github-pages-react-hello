# HAVENLY auth/layout checkpoint — 2026-04-14 12:38 UTC

## Slice
Tighten the action-required continuation entry point for live auth sessions, specifically the `complete-profile` follow-up path that was progressing on live Pages but not always surfacing where the smoke expected it.

## Why this slice
The previous live public-auth validation proved that GitHub Pages can now reach a real public auth backend and persist cross-site cookies. The remaining failure moved later in the flow:
- login/session creation works
- save/merge flows advance
- the complete-profile continuation sometimes appears as a top session notice path rather than an already-open modal path

That means the next coherent checkpoint is not backend plumbing anymore; it is the customer-facing continuation handoff between the restored session banner and the account modal.

## Coherent group edited
- `src/components/auth-session-view-state.js`
- `src/components/auth-session-view-state.test.js`
- `src/main.jsx`
- `scripts/auth-login-smoke.mjs`

## What changed
### 1. Shared notice CTA mapping for action-required auth states
Extracted the session-notice primary-action mapping into a shared helper so action-required states use explicit customer-facing labels instead of the generic `계정 상태 보기`.

Current live notice labels:
- `complete-profile` → `프로필 보완 열기`
- `verify-email` → `이메일 인증 이어가기`
- `confirm-merge-resolution` → `병합 방향 선택 열기`

This keeps the banner honest about what the next click will do.

### 2. Main app banner now uses the shared continuation mapping
`AuthSessionNoticeBanner` now uses the shared helper rather than carrying a separate hard-coded label matrix.

### 3. Live smoke now follows the real continuation entry point
The smoke no longer assumes the complete-profile CTA must already be visible inside the modal immediately after login.

Instead it now:
- accepts the CTA if the modal stays open, or
- clicks the live session-notice button (`프로필 보완 열기`) when the continuation is surfaced there first,
- then verifies that the modal CTA (`프로필 보완 제출`) appears.

This keeps the smoke aligned with the real product surface while still requiring the full continuation UI to exist.

### 4. Coverage added for notice CTA labeling
Added focused unit coverage for the notice primary-action mapping so the banner labels for action-required vs resumable states stay stable.

## Validation
- `npm test` ✅
- `npm run build` ✅
- `npm run security:secrets` ✅
- `npm run build:pages` ✅

## Next live loop
1. commit + push this checkpoint from `main`
2. wait for Pages deploy
3. re-run the live auth smoke against the deployed URL with the public auth backend override
4. confirm whether complete-profile now advances through the notice→modal continuation cleanly
5. if that passes, continue into the next real auth/layout blocker rather than broad app work
