# HAVENLY auth/layout live message drift checkpoint — 2026-04-14 05:31 UTC

## Live feedback that drove this slice
After the Pages-sync fix landed and the live site finally served the new bundle, a real authenticated layout pass on GitHub Pages exposed a smaller but real UX bug in the account-board panel:

1. sign up on live `#layout`
2. save the current board to the account
3. change the tray/board state

The panel correctly switched to drift copy (`현재 보드가 계정 저장본과 달라졌어요…`) **but** it still kept showing the previous success toast-style line (`현재 배치를 계정 저장본으로 업데이트했어요.`). That stale status message could make the board look freshly synced even though the comparison state had already moved back into drift.

## Changes in this slice
- `src/components/layout-auth-panel-state.js`
  - added stale-message suppression for `saved` / `restored` panel messages when the current board has drift again
  - kept the success message visible when the current board still matches the saved account state
- `src/components/layout-auth-panel-state.test.js`
  - added focused coverage for hiding stale success copy once tray-only drift returns
  - added focused coverage for keeping the success copy while the board still matches the saved state

## Validation
- `node --test src/components/layout-auth-panel-state.test.js` ✅
- `npm test` ✅ (`230` passing)
- `npm run build:pages` ✅
  - fresh bundle: `index-CGfe5K9x.js`
- `npm run security:secrets` ✅

## Live verification target after push
Repeat the same live flow:
- sign up / log in on `#layout`
- save the board
- remove or place one tray item

Expected result:
- board comparison copy should switch to drift state
- the old success line should disappear immediately
- restore CTA should stay enabled until the board matches again
