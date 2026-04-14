# HAVENLY auth/layout checkpoint — 2026-04-14 04:20 UTC

## Slice completed
The layout account-restore affordance now detects full board drift instead of only room-canvas drift, so authenticated users can restore a saved board after changing the recommendation tray or recommendation metadata.

## What changed
- `src/components/layout-auth-panel-state.js`
  - expanded restore drift detection to compare:
    - saved vs current placed layout items
    - saved vs current `layoutTrayItems`
    - saved vs current recommendation draft metadata
  - kept the panel-state logic customer-facing while broadening what counts as a changed board.
- `src/main.jsx`
  - the layout auth panel state now receives the current tray state and current recommendation draft (`aiForm`) so restore gating matches the real persisted board scope.
- `src/components/layout-auth-panel-state.test.js`
  - strengthened the no-drift case to include tray + recommendation metadata
  - added regression coverage for tray-only drift
  - added regression coverage for recommendation-draft-only drift

## Why this matters
The previous checkpoint taught the save/restore path to persist tray state and recommendation draft metadata in the backend/account state. But the restore button was still gated only by `layoutItems` drift. That meant a user could save a board, change only the remaining recommendation tray or recommendation metadata, and then be unable to restore the saved account board even though meaningful persisted state had changed.

This checkpoint aligns the restore affordance with what the authenticated board actually saves and restores.

## Validation
- `npm test -- src/components/layout-auth-panel-state.test.js`
  - green (full node test expansion also passed under the package test command)
- `npm run build`
  - green

## Next likely live check
After deploy, test the GitHub Pages build by reproducing a tray-only change (for example, place or abandon one recommendation-card item without changing the placed room items) and confirm the account restore CTA becomes available instead of staying disabled.
