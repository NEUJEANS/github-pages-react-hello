# HAVENLY auth/layout checkpoint — 2026-04-14 07:51 UTC

## Slice
Saved-board apartment context serialization during authenticated layout saves.

## What live testing showed after the previous fix
The first hydration fix successfully kept the **current** apartment selection on reload, but the account-board panel still rendered the **saved** context as the old apartment (`래미안 포레스트 84A`) even after saving under `아크로 리버뷰 101A`.

That narrowed the issue from reload hydration to the save payload itself.

## Files touched together
- `src/main.jsx`
- generated Pages bundle via `npm run build:pages` (`docs/index.html`, `docs/assets/*`)

## Change
Updated `handleSaveLayoutToAccount()` so the authenticated save continuation explicitly serializes:
- `apartmentLabel: formatApartmentOption(selectedApartment)`
- alongside the already-updated `apartmentSelectionId`

Before this, the save request could carry the new apartment id while still reusing an older `apartmentLabel` from the previous draft/auth payload, which kept the saved-board copy stale.

## Validation
- `npm test` ✅ (`234` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Expected live result
On live `#layout`, after switching to `아크로 리버뷰 101A` and saving:
- the saved-board context line should update to the 101A apartment context
- reloading while authenticated should keep both the current context and the saved context aligned to the newly saved apartment

## Next likely follow-up if live is green
Address the separate UX rule where pure context drift (saved/current apartment context mismatch without layout/tray drift) still reports “현재 보드가 계정 저장본과 같아요” and keeps restore disabled.
