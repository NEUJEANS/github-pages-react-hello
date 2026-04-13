# 2026-04-10 auth logout keepalive checkpoint

## What changed
- added `keepalive: true` to `signOutAuthSession()` network logout requests
- extended the logout request contract test to assert the keepalive flag is sent

## Why
- the app clears local auth state optimistically, then tears down the backend session asynchronously
- using `keepalive` makes the logout POST much more likely to complete even if the page is reloaded or navigated immediately after logout
- this hardens the real frontend -> backend -> sqlite auth path without adding any visible product UI

## Validation
- `node --test src/components/auth-submit.test.js server/auth-http-server.test.js server/auth-persistent-store.test.js`
- `npm test`

## Notes
- no visible progress/debug/report blocks were added to the UI
- the proxy-backed browser smoke still deserves a dedicated reliability pass in a later checkpoint, but logout teardown is now safer for real session persistence work
