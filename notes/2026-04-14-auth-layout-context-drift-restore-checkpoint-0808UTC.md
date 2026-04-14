# HAVENLY auth/layout checkpoint — 2026-04-14 08:08 UTC

## Slice
Enable saved-board restore affordances when only the saved/current apartment-context copy drifts, even if layout items, tray items, and recommendation metadata still match.

## Why this slice
Live verification earlier exposed a UX/backend continuity gap:
- users could save a board under one apartment context
- later switch apartment context without changing the actual layout payload
- and the panel would still say the board matched the account save, leaving restore disabled

That made the auth-backed board continuity feel incomplete even though the apartment context is part of the persisted save semantics now.

## Files touched together
- `src/components/layout-auth-panel-state.js`
- `src/components/layout-auth-panel-state.test.js`
- generated Pages bundle via `npm run build:pages` (`docs/index.html`, `docs/assets/*`)

## Change
Updated the layout auth panel state logic so:
- saved/current board context copy is computed before drift resolution
- context-only mismatches (`savedBoardContextCopy !== currentBoardContextCopy`) count as drift **when both sides have explicit context copy**
- restore becomes available for that drift case
- copy now consistently treats context mismatch as a real “saved board differs” state
- older saves without current explicit context still avoid false perpetual drift

## Validation
- `npm test -- src/components/layout-auth-panel-state.test.js` ✅
- full suite via expanded test script ✅ (`235` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Expected live behavior after deploy
On live `#layout`, when authenticated:
1. save the current board
2. change only the apartment context / saved-vs-current context copy
3. leave layout/tray/recommendation otherwise unchanged
4. confirm the panel now treats that as drift and enables `계정 저장본 불러오기`

## Next likely slice if live is green
Stay in auth/layout continuity and inspect whether explicit restore should also immediately re-sync every derived context label/counter after a context-only restore, or whether the next real backend-facing gap has moved to account bootstrap/session refresh timing.
