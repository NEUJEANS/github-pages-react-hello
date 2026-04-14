# HAVENLY checkpoint — scaffold save-layout continuation now persists account state for reload hydration

- Time: 2026-04-14 08:47 UTC
- Repo: `havenly-live`
- Branch: `main`
- Focus slice: authenticated layout save/restore path only

## Why this slice
Live verification earlier showed that saving a board under a different apartment while authenticated did not survive a reload. The page-specific docs pointed to the layout editor screen, while the recomposition guide confirmed the actual auth bootstrap and persistence chain still lives in `src/main.jsx` + auth helper modules. To stay page-context-light, only the layout page summary plus the save/rehydrate/auth helper modules were inspected.

## Files changed in this checkpoint
- `src/components/auth-backend-scaffold.js`
- `src/components/auth-backend-scaffold.test.js`
- regenerated deploy assets under `dist/` and `docs/`

## What changed
Grouped the work as one coherent backend/auth slice instead of scattered UI patches:

1. **Draft-save contract completion**
   - `buildDraftSaveState()` now keeps `layoutTrayItems` and an explicit `recommendationDraft` when present.
   - This keeps the save payload closer to the real board state the layout page sends.

2. **Authenticated continuation persistence**
   - Added `buildUpdatedAccountStateForDraftSave()` in the scaffold backend helper.
   - `submitAuthScaffoldContinuation()` now has an explicit `save-layout-draft` branch that:
     - derives the next account state from the incoming board save payload,
     - persists that state into the scaffold account DB,
     - updates the in-memory scaffold session,
     - returns `status: ready` / `statusLabel: 보드 저장 완료` with refreshed `accountState`.

3. **Regression coverage**
   - Added a focused test proving that an authenticated save updates `accountState.apartmentSelectionId`, `layoutItems`, `layoutTrayItems`, and the recommendation room so a later session read can rehydrate the changed apartment context.

## Verification done before deploy
- Ran targeted test set covering this auth/layout slice:
  - `npm test -- --test-name-pattern='auth-backend-scaffold|auth-storage|auth-session-restore|layout-auth-panel-state'`
- Result: pass
- Ran production build + docs sync:
  - `npm run build:pages`
- Ran secret scan before upload:
  - `npm run security:secrets`
- Result: no secrets found

## UI guard check
- No new debug/progress/report UI was added to the product surface.
- All progress details remain in notes/tests only.

## Next live verification target after push
On the deployed GitHub Pages site:
1. open `#layout`
2. login as `board@example.com` / `password123`
3. switch apartment from `래미안 포레스트 84A` to `아크로 리버뷰 101A`
4. save board
5. reload while staying authenticated
6. confirm saved/current context and apartment selection remain on `101A`

## Open question after this slice
If live reload still falls back to `84A` after this deploy, the remaining suspect is no longer the scaffold continuation persistence itself; it would likely be in the frontend bootstrap order or a separate overwrite after session rehydration.
