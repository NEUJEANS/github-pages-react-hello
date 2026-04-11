# 2026-04-11 HAVENLY auth http server repair + smoke checkpoint

## What I changed

- Rebuilt `server/auth-http-server.js` after it had been overwritten by a markdown/Gemini review blob and was no longer valid JS.
- Restored standalone auth HTTP server behavior for:
  - `/api/auth/health`
  - `/api/auth/login`
  - `/api/auth/signup`
  - `/api/auth/session`
  - `/api/auth/pending`
  - `/api/auth/logout`
  - `/api/auth/continue`
  - `/api/auth/verification/start`
  - `/api/auth/verification/status`
  - `/api/auth/verification/callback`
  - `/api/auth/layout/track`
- Preserved sqlite-backed wiring and CLI option parsing/export coverage used by the existing backend tests.
- Added popup callback HTML that posts `havenly-verification-complete` back to the opener and attempts to close itself.
- Extended `scripts/auth-login-smoke.mjs` to cover:
  - popup-triggered verify-email flow instrumentation
  - layout tray drop-to-room behavior
  - layout tray abandon behavior
- Kept this as smoke/instrumentation work only — no product-facing debug UI added.

## Validation

- `node --test server/auth-http-server.test.js` ✅
- `npm run smoke:auth:proxy` ✅
- `npm test` ✅ (210/210 passing)

## Important smoke findings

### 1) Major repo blocker was fixed

`server/auth-http-server.js` had been replaced with markdown starting with `# Gemini Review`, which broke:
- backend tests
- auth proxy startup
- browser smoke

That file is now executable again and all tests pass.

### 2) Layout tray behavior is now covered in smoke

Smoke now verifies:
- initial tray count / placed count
- dropping a tray item into `.roomFrame` removes it from the tray and increases placed count
- abandoning a tray item outside the room removes it from the tray without increasing placed count

Observed smoke result:
- initial tray: 3
- initial placed: 5
- after room drop: tray 2 / placed 6
- after abandon: tray 1 / placed 6

This is consistent with the backend counter wiring already covered by unit tests for `selectedComponent` and `abandonedComponent`.

### 3) Verify-email popup path is only partially healthy in browser smoke

Smoke now proves the UI opens the popup/callback route, but the popup callback result is still not fully healthy end-to-end in the browser path.

Observed smoke output:
- popup URL opened:
  `http://127.0.0.1:4174/api/auth/verification/callback?verificationId=verify_...&status=verified`
- popup body returned JSON error instead of success HTML:
  `{"message":"Verification not found", ...}`
- modal copy stayed on the pre-submit requirement message:
  `계속하려면 인증 코드 항목을 먼저 채워주세요.`

So the current state is:
- backend verification endpoints pass unit/integration tests
- popup route is reachable from the browser flow
- but the browser/proxy callback path is still not resolving the verification request correctly

## Next best step

Investigate why the proxy/browser popup callback produces `Verification not found` despite the `verificationId` being present in the popup URL.

Most likely places to inspect next:
- auth proxy request forwarding for popup GETs with query params
- callback request path/query parsing under the preview/proxy combo
- whether verification records are being created in one sqlite-backed server instance and callback hits another
- whether the popup callback is bypassing the same store source/options used by verification start/status
