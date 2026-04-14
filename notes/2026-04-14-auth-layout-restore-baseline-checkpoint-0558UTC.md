# HAVENLY auth/layout restore baseline checkpoint — 2026-04-14 05:58 UTC

## Why this slice mattered
Live auth/layout work was already saving richer board state, but there was still a restore-side compatibility gap:

- older account saves can exist without a persisted `recommendationDraft`
- restore logic in `main.jsx` merged saved recommendation fields into the current AI form instead of rebuilding from a clean baseline
- the layout auth panel treated `currentRecommendationDraft` vs `null` as drift, which could make older saved boards look permanently out-of-sync even after restore

That meant some account-backed boards could never fully return to a clean “saved == current” state, and restore could leave stale recommendation context hanging around.

## Changes in this slice
### `src/components/auth-account-continuity.js`
- added `buildRestoredRecommendationDraft(accountState, fallbackDraft)`
- centralizes the rule for rebuilding recommendation context from saved account state, with a clean fallback baseline when no saved recommendation draft exists

### `src/main.jsx`
- switched auth-session restore paths to use `buildRestoredRecommendationDraft(..., initialAiForm)`
- switched explicit layout restore to the same helper
- this makes restore behavior coherent across:
  - persisted auth session rehydrate
  - successful auth continuation/session replacement
  - explicit “계정 저장본 불러오기” from the layout editor

### `src/components/layout-auth-panel-state.js`
- recommendation drift now only participates when the account actually has a saved recommendation draft
- older saves without recommendation metadata no longer get stuck in false drift purely because the current UI still has the default AI form loaded

## Tests added/updated
### `src/components/auth-account-continuity.test.js`
- fallback-to-baseline behavior when saved recommendation context is absent
- saved recommendation context still wins when present

### `src/components/layout-auth-panel-state.test.js`
- added coverage ensuring older saved boards without recommendation metadata do not stay in perpetual drift after restore

## Validation
- `node --test src/components/auth-account-continuity.test.js src/components/layout-auth-panel-state.test.js` ✅
- `npm test` ✅ (`233` passing)
- `npm run build:pages` ✅
  - fresh bundle: `index-Cj6U6_RS.js`
- `npm run security:secrets` ✅

## Sync / safety state before push
- local `main` was fetched first
- local `main` matched `origin/main` before edits (`0 ahead / 0 behind`)
- this checkpoint is safe to push once committed

## Live verification target after push
Use the live GitHub Pages site and check:
1. authenticated layout save still works
2. save -> drift -> restore still returns to the clean matched state
3. no stale status/debug/process copy appears in the product UI
4. production serves the new bundle `index-Cj6U6_RS.js`

## Likely next slice after live check
If live production is clean after this push, the next useful slice should stay in auth/layout and focus on the next real state gap revealed by production behavior rather than local speculation.
