# HAVENLY auth/layout checkpoint — 2026-04-14 07:46 UTC

## Slice
Persisted auth-session hydration for the layout editor reload path.

## Why this slice
Live verification on `main` showed an authenticated save under a different apartment appeared to succeed, but a browser reload snapped the app back to the default apartment/context (`래미안 포레스트 84A`). The bug looked like a restore-path regression rather than a save-request failure.

## Files touched together
- `src/main.jsx`
- generated Pages bundle via `npm run build:pages` (`docs/index.html`, `docs/assets/*`)

## Changes
1. **Boot state now hydrates the selected apartment from persisted auth state**
   - `spaceProfile` initialization now prefers:
     - `persistedAuthUiRestore.apartmentSelectionId`
     - then `persistedAuthSession.accountState.apartmentSelectionId`
     - then the default apartment
   - it also resolves the matching apartment metadata so `apartmentType` stays aligned with the restored selection.

2. **Persisted auth sessions now re-apply once after reload**
   - `appliedAuthSessionRestoreRef` now starts at `null` instead of `persistedAuthSession.savedAt`
   - this allows the existing post-auth restore effect to run once on first mount for an already-saved authenticated session, restoring continuity state like saved apartment/layout/tray/recommendation data instead of silently skipping the restore.

## Validation
- `npm test` ✅ (`234` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Expected live verification target
On the deployed `#layout` page:
1. log in with the demo account
2. change apartment to `아크로 리버뷰 101A`
3. save the board
4. reload while still authenticated
5. confirm the restored apartment/context remains `101A` instead of snapping back to `84A`

## Next likely follow-up after live check
If apartment persistence now survives reload, inspect the secondary UX gap noted in the previous live note: whether pure context drift should also enable `계정 저장본 불러오기` when the saved/current apartment context differs without item-level drift.
