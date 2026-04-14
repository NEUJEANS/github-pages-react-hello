# HAVENLY auth/layout checkpoint — 2026-04-14 08:15 UTC

## Slice
Fix explicit saved-board restore so it rehydrates the full apartment context (`apartmentSelectionId` + derived `apartmentType` + display query) instead of only flipping the saved selection id.

## Live feedback that triggered this slice
After deploying the previous context-drift affordance fix, live verification showed:
- the panel correctly detected saved/current context drift
- `계정 저장본 불러오기` became available
- but clicking restore left the visible current-context copy stuck on the switched apartment label

So the affordance was right, but the restore action was incomplete.

## Root cause
The restore paths were setting only:
- `spaceProfile.apartmentSelectionId`

But the layout/context UI derives the visible board context from the broader `spaceProfile`, especially:
- `apartmentType`
- `query`
- `apartmentSelectionId`

That meant restore could carry the saved id internally while still showing stale derived apartment context in the UI.

## What changed together
- `src/main.jsx`
  - imported `applyApartmentSelection()` from `space-profile-state`
  - added a single `syncSpaceProfileApartmentSelection()` helper that resolves the saved apartment option and updates the full `spaceProfile` coherently
  - switched both post-auth bootstrap restore and explicit `handleRestoreSavedLayout()` to use that helper instead of writing only `apartmentSelectionId`
- generated Pages output in `docs/` via `npm run build:pages`

## Why this matters
This closes the gap between:
- backend/account-saved apartment context
- frontend restore affordance state
- actual visible restored layout context

Without this, the product claimed it restored the saved board while still presenting stale apartment labeling/context.

## Validation
- `npm test` ✅ (`235` passing)
- `npm run build:pages` ✅
- `npm run security:secrets` ✅

## Required follow-up
Push, wait for Pages deploy, then verify live:
1. login on `#layout`
2. switch apartment context only
3. confirm restore CTA is available
4. click `계정 저장본 불러오기`
5. verify current-context copy snaps back to the saved apartment context and restore disables when matched
