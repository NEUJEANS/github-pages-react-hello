# HAVENLY SPA Transition Refinement Checklist

Research basis used before implementation:
- Motion / AnimatePresence: keyed enter/exit transitions for in-place UI changes and overlays
- Material motion: fade-through/shared-axis for continuity between related screens
- Carbon loading patterns: when a transition is immediate, avoid showing a loading indicator; keep context and only use localized/real loading states when needed

## Must satisfy
- [x] Screen changes happen inside the SPA without browser page reloads
- [x] Main screen switches use short in-place motion to preserve continuity
- [x] Transition direction is resolved from screen groups, not a single flat route list
- [x] Middle-group screens (03/03A) enter from the left when reached from 04/05, and from the right when reached from 01/02
- [x] Address/setup opens as an overlay over the current flow instead of feeling like a separate page load
- [x] No spinner / blank-loading state is shown for immediate local transitions
- [x] Primary CTAs and top navigation trigger actual connected flow transitions
- [x] URL hash reflects the visible SPA state so direct open/reload preserves context
- [x] Reduced-motion users are respected with near-instant transitions
- [x] Live deployed site manually verified in browser after deployment
