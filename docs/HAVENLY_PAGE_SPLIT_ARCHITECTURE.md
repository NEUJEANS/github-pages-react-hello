# HAVENLY Page Split Architecture

## Goal
Reduce `src/main.jsx` screen bloat without destabilizing app state.

## What changed
- Extracted screen markup into 3 page-level files under `src/pages/`.
- Kept root state/hooks in `src/main.jsx`.
- Kept helpers in existing `src/components/*` state/view modules.

## Page ownership summary
- AI funnel: `src/pages/recommendation-onboarding-pages.jsx`
- Layout editor: `src/pages/layout-editor-page.jsx`
- Commerce: `src/pages/catalog-shopping-pages.jsx`

## Why this is a good intermediate stop
- Lower token weight per file for future agents.
- Easier targeted reviews.
- Safer than moving persistence/auth/editor math all at once.

## Next likely extractions
1. shared header + shell
2. cart/search/login/quickview modal shells
3. root constants/config into dedicated modules
4. optional route table or screen registry
