# HAVENLY auth/layout checkpoint — 2026-04-14 04:56 UTC

## Slice completed
Fixed the guest-to-account auth handoff so login/signup continuity now carries the live recommendation tray snapshot into the serialized guest draft, instead of dropping tray state before account merge/bootstrap ever starts.

## Live feedback that triggered this slice
After the previous bootstrap-hydration checkpoint was deployed, a live GitHub Pages auth pass exposed a deeper upstream gap:
- authenticated layout panel showed `저장본 배치 5개 · 트레이 0개`
- the visible recommendation tray still showed 3 cards
- save + reload kept the same mismatch

That meant the database/client hydration patch was not enough by itself. The login/signup guest draft being handed into auth was still omitting `layoutTrayItems`, so the account state could begin life with the wrong tray snapshot.

## What changed
- `src/components/auth-flow-state.js`
  - `buildGuestDraftSnapshot()` now accepts `layoutTrayItems`.
  - serializable guest handoff continuity now includes cloned tray items.
- `src/components/auth-flow-state.test.js`
  - updated the guest draft snapshot contract test to verify tray items are carried through the auth handoff payload.
- `src/main.jsx`
  - the guest draft snapshot memo now passes the current `layoutTrayItems` into `buildGuestDraftSnapshot()`.
- `docs/`
  - refreshed the GitHub Pages build output after the fix.

## Why this mattered
The previous checkpoint fixed *downstream hydration* of tray state from persisted account data.
This checkpoint fixes the *upstream auth handoff* that feeds that persisted account data in the first place.

Without both sides:
- save/restore from an already-correct account snapshot could work better, but
- a fresh signup/login merge could still seed account state with an empty/missing tray snapshot.

Now the auth/layout continuity path is more consistent end-to-end:
1. guest board captures tray snapshot
2. auth handoff serializes it
3. backend/account state can persist it
4. client hydration can restore it

## Validation
- Tests:
  - `npm test -- src/components/auth-flow-state.test.js src/components/auth-account-continuity.test.js src/components/auth-session-merge.test.js`
  - green (full expanded suite passed)
- Build:
  - `npm run build`
  - green
- Live-site feedback before fix:
  - GitHub Pages auth signup flow reproduced a panel/tray mismatch (`saved tray 0` vs visible tray `3`)

## Next live verification target
Push this follow-up checkpoint, then re-run the live auth signup/save/reload flow and confirm the layout panel tray count matches the visible tray count immediately after auth and after reload.