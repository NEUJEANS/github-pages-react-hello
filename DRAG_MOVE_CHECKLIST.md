# HAVENLY Drag-Move Checklist

- [x] Identify the active HAVENLY React app and deployment target
- [x] Research direct-manipulation drag patterns for mouse/touch layout editors
- [x] Translate research into concrete interaction rules for HAVENLY
- [x] Remove button-based movement affordance from the editor UI
- [x] Implement direct press-and-drag movement for placed furniture
- [x] Keep selection, undo, snap toggle, rotate, and color flows coherent
- [x] Add visible affordance/copy so drag behavior is discoverable
- [x] Build locally and fix any regressions
- [x] Run a manual browser feedback loop on desktop/mobile-style interaction
- [x] Commit and push to GitHub
- [x] Verify GitHub Pages deployed the new bundle
- [x] Re-test the live deployed interaction directly

## Research notes applied

- Selected furniture should stay visibly highlighted while moving.
- Dragging should feel direct: grab/grabbing cursor, lifted visual state, no extra arrow controls.
- Snap-to-grid should remain optional and be reflected in status copy.
- Touch dragging should avoid browser gesture conflict (`touch-action: none` on the editing surface).
- Undo should still work after a drag move.
