# HAVENLY Page Recomposition / Merge Guide

This split is intentionally **screen-level only**.
App state, persistence, auth bootstrap, overlays, drawers, and shared constants still live in `src/main.jsx`.

## Current page modules
- `src/pages/auth-entry-page.jsx`
- `src/pages/layout-editor-page.jsx`
- `src/pages/final-surface-page.jsx`

## How they recombine later
If the project ever needs to merge back into a single top-level screen file:

1. Move exported page components back into `src/main.jsx` in this order:
   - commerce pages
   - AI flow pages
   - layout editor page
2. Keep the existing `renderScreen()` routing shape.
3. Preserve prop signatures first; inline dependencies only after tests pass.
4. Do **not** merge helper logic out of `src/components/*` unless there is a separate reason.
5. Re-run build/tests/smoke after each merge block.

## Recommended future direction instead of re-merging everything
A better next step is usually:
- keep page files split
- extract shared shells (`Header`, drawers, modals) into `src/components/app-shell-*`
- introduce a typed page-props map or context boundary
- add page-focused tests

## Dependency map
- `main.jsx` owns state and orchestration.
- `renderScreen()` chooses the page module.
- Each page module receives only the screen-specific props it needs.
- Cross-cutting modals remain in `main.jsx` for now.

## Merge-risk notes
- Auth/login modal behavior is still tightly coupled to root state.
- Editor page depends on several command/helper factories.
- Recommendation and commerce screens still share product constants from the root.

## Safe verification after recomposition
- `npm test`
- `npm run build`
- `npm run smoke:auth` if auth-related wiring was touched
