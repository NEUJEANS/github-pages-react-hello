# HAVENLY Page Split Architecture

## Goal
Reduce root screen bloat without destabilizing the current frontend state.

## What changed
- `src/main.jsx` is now only the React bootstrap entry.
- Root orchestration moved under `src/app-shell.jsx`.
- Screen markup is split into 3 page-level files under `src/pages/`.
- State/view helpers stay in `src/components/*` until each slice is safe to extract further.

## Page ownership summary
- AI funnel: `src/pages/auth-entry-page.jsx`
- Layout editor: `src/pages/layout-editor-page.jsx`
- Commerce: `src/pages/final-surface-page.jsx`

## Why this is a good intermediate stop
- Lower token weight per file for future agents.
- Easier targeted reviews.
- Safer than moving persistence/auth/editor math all at once.

## 2026-04-16 React-only cleanup note
- Preserved the current frontend product surface while removing more apartment-prep coupling from `src/app-shell.jsx`.
- Replaced apartment/address/selected-space board context with a single board-centric label: `프로젝트 레이아웃 보드`.
- Kept auth/session continuity frontend-only and mockable; save/restore still flows through the local auth scaffold without runtime tunnel assumptions.
- Simplified the auth guard card so it no longer surfaces retired apartment-selection / recommendation-prep metrics.
- Validation completed for the changed slice:
  - `node --test src/components/auth-draft-save-payload.test.js src/components/auth-flow-state.test.js src/components/auth-session-restore.test.js src/components/layout-auth-panel-state.test.js`
  - `npm run build`

## Next likely extractions
1. move frontend-only auth/session orchestration out of `src/app-shell.jsx` into a dedicated board/auth hook or controller
2. trim dead connection-summary branches that no longer affect visible UI copy
3. root constants/config into dedicated modules with semantic filenames
4. optional route table or screen registry
