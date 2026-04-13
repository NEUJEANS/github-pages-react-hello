# HAVENLY Page 02 · Layout Editor

## File
- `src/pages/layout-editor-page.jsx`

## Owns
- `LayoutEditorPage`

## User journey
1. User enters the drag-and-drop floorplan editor.
2. User browses the furniture library.
3. User places, drags, rotates, recolors, and saves/resumes layout intent.
4. User can hand off to auth when saving is gated.

## Inputs from `main.jsx`
- Navigation + overlay controls
- Auth trigger/session state
- Full editor state object
- Address summary
- Shared catalog constants (`libraryItems`, `aiProducts`)
- Editor helper functions from `src/components/*`

## Why this split exists
- The editor is the densest interaction surface in the app.
- Isolating it keeps the screen-level event wiring out of the root file.
- Future editor-specific tests or refactors can target one module.

## Safe edits here
- Editor sidebars
- Toolbar rendering
- Canvas click/drag event plumbing
- Property panel UI
- Library search/category presentation

## Avoid moving here
- Low-level editor math/state helpers already in component modules
- Auth persistence/bootstrap logic
- Cross-app modal composition
