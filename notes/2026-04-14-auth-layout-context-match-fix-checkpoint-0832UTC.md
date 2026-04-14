# HAVENLY auth/layout checkpoint — 2026-04-14 08:32 UTC

## Slice
Remove false account-board drift on the live layout page when the saved board and current board point at the same apartment context but use different display strings.

## Live regression reproduced
After the main deploy was live on `assets/index-BOnJPgCX.js`, a browser verification pass on:
- `https://neujeans.github.io/github-pages-react-hello/#layout`

showed this sequence:
1. open `#layout`
2. login as `board@example.com`
3. land back in the layout page

Observed result:
- account board immediately showed drift
- saved context: `거실 · 래미안 포레스트 84A`
- current context: `거실 · 84A · 3개 공간 선택`
- restore CTA stayed enabled even though the restored board was effectively the saved board

This is a product bug because the mismatch came from label formatting, not a real backend/account-state difference.

## Root cause
`buildLayoutAuthPanelState()` was deciding `boardContextMatches` by comparing the rendered context copy strings.

That is too fragile because:
- saved side prefers persisted apartment labels like `래미안 포레스트 84A`
- current side prefers the live editor summary like `84A · 3개 공간 선택`

So identical apartment context could still look different and trigger perpetual drift.

## What changed together
### `src/components/layout-auth-panel-state.js`
- added `currentApartmentSelectionId` input
- derived `savedApartmentSelectionId` from `authSession.draftSave` / `accountState`
- changed `boardContextMatches` to prefer stable comparison using:
  - apartment selection id
  - recommendation room
- kept the old rendered-copy comparison only as fallback for older payloads that lack ids

### `src/main.jsx`
- passed `spaceProfile.apartmentSelectionId` into `buildLayoutAuthPanelState()` so the panel uses the live stable context id instead of inferring from copy text

### `src/components/layout-auth-panel-state.test.js`
- updated coverage for id-based context matching
- added a regression test proving that same apartment id + same room does **not** report drift even when labels differ
- kept a separate test showing restore still enables when apartment ids truly differ

## Validation
- targeted test: `node --test src/components/layout-auth-panel-state.test.js` ✅
- full suite: `npm test` ✅ (`236` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Build output prepared for Pages
- live-ready asset emitted: `assets/index-C7tTQ_xF.js`

## Next step
Commit/push this auth/layout slice, wait for Pages to serve `index-C7tTQ_xF.js`, then re-run the live login verification and confirm the account-board restore CTA is no longer falsely enabled immediately after restore/login.
