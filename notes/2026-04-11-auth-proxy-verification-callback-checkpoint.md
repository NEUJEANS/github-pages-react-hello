# 2026-04-11 auth proxy verification callback checkpoint

## What changed
- Fixed the Vite auth proxy so `/api/auth/verification/callback` preserves the original query string when forwarding to the standalone auth backend.
- Tightened the browser smoke so the verification popup must now reach the callback success HTML instead of silently accepting a `Verification not found` JSON fallback.
- Updated the verify-email smoke expectation to match the real post-verification state transition: after callback + reload, the ready panel advances from `이메일 인증 확인` to `현재 흐름으로 돌아가기`.
- Styled the inline verification success copy with a green success class instead of the generic muted text.

## Validation
- `npm test` ✅
- `npm run smoke:auth:proxy` ✅

## Current observed behavior
- Proxy callback mismatch is fixed: the popup now resolves to the success HTML and the persisted auth session advances to `이메일 인증 완료`.
- The smoke still records that the inline modal copy is not reliably observed before reload in automation, even though the reloaded auth state is correct and the callback/session status flow is now backend-backed.

## Likely next slice
- If needed, make the in-modal success text/state transition more deterministic before reload (likely around popup/postMessage timing) so the green `본인 인증이 완료되었습니다` state is consistently visible without relying on reload.
