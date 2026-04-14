# HAVENLY auth/layout checkpoint — 2026-04-14 07:19 UTC

## Slice
Persist the selected apartment identity through authenticated board-save and restore flows so the saved board can rehydrate the right apartment context instead of only partial room/layout state.

## Why this slice mattered
Recent HAVENLY auth/layout work already preserved:
- account-backed layout items
- tray state
- recommendation metadata
- saved/current board context copy

But the apartment choice itself (`apartmentSelectionId`) was still inconsistently carried across the auth continuation + persistence + restore path.

That created a real backend/product continuity gap:
- a user could save a board while scoped to a specific apartment/unit
- later restore the board
- and still remain on the wrong local apartment selection unless the current page state happened to match

Because apartment selection drives layout/address context and recommendation framing, this needed to be treated as part of the real persisted board state.

## Files touched in this slice
- `src/main.jsx`
- `src/components/auth-account-continuity.js`
- `src/components/auth-account-continuity.test.js`
- `src/components/auth-backend-scaffold.js`
- `src/components/auth-flow-state.js`
- `src/components/auth-session-restore.js`
- `src/components/auth-session-restore.test.js`
- `src/components/auth-storage.js`
- `server/auth-persistent-store.js`
- generated Pages output in `dist/` + `docs/`

## What changed

### 1) Save/continuation payloads now include apartment selection
The auth draft-save serialization path now carries `apartmentSelectionId` alongside:
- `draftLabel`
- `apartmentLabel`
- `selectedSpaceIds`
- `layoutItems`
- `layoutTrayItems`
- `recommendationDraft`

This was updated in the client handoff/persistence helpers so login/signup/continuation flows all preserve the same board context field.

### 2) SQLite-backed account state now retains apartment selection
The server persistent auth store now:
- initializes `accountState.apartmentSelectionId`
- includes apartment selection in guest draft summaries
- preserves it in normalized draft-save state
- applies it into the persisted account state during authenticated board-save flows

This makes apartment selection part of the real backend account continuity model rather than a frontend-only convenience value.

### 3) Restore paths now reapply the saved apartment context
Both post-auth restore and explicit “restore saved board” flows now read the saved apartment selection and patch `spaceProfile.apartmentSelectionId` before or alongside restoring the rest of the account-backed board state.

That keeps the restored board aligned with the apartment/unit it was saved from.

## Validation
Ran successfully:
- `npm test -- src/components/auth-account-continuity.test.js src/components/auth-session-restore.test.js src/components/auth-flow-state.test.js src/components/auth-storage.test.js server/auth-persistent-store.test.js`
- `npm test`
- `npm run build:pages`
- `npm run security:secrets`

Results:
- full suite green (`234` passing)
- Pages build regenerated successfully
- fresh JS bundle: `docs/assets/index-DpyZtUIj.js`
- secret scan clean (0 verified / 0 unverified)

## Sync / safety state
Before touching code:
- fetched `origin/main`
- local `main` had no remote drift (`0 behind / 0 ahead`)

So this checkpoint is safe to commit/push from the main worktree.

## Live verification target after push
Check the live GitHub Pages app and confirm that:
1. the new bundle is served
2. saved board restore still works end-to-end
3. restoring a saved board also puts the layout back onto the saved apartment selection
4. no debug/report/process UI was introduced

## Best next slice if live is green
Stay in the same auth/layout continuity area and use the live result to decide the next concrete backend-facing gap, ideally around:
- clearer saved-vs-current restore semantics when context differs, or
- any newly exposed mismatch between saved account board metadata and explicit restore behavior.
