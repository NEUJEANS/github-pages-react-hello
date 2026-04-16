# HAVENLY Page 03 · Commerce

## File
- `src/pages/catalog-shopping-pages.jsx`

## Owns
- `FurnitureHomePage`
- `BedsCategoryPage`

## User journey
1. User lands in furniture-first browsing.
2. User jumps into category browsing, filters, wishlist, and quick view.
3. User can route back into AI flow or layout editing from commerce entry points.

## Inputs from `main.jsx`
- Navigation + overlay controls
- Auth trigger/session state
- Filter state + setters
- Wishlist handlers
- Quick-view/cart actions
- Shared product constants (`aiProducts`, `bedProducts`)

## Why this split exists
- Commerce-facing pages share tone and catalog behavior.
- Keeping them together prevents the root app file from mixing storefront markup with auth/editor orchestration.
- Makes future category expansion more obvious.

## Safe edits here
- Hero/banner layout
- Category navigation copy
- Bed catalog filtering UI
- Wishlist button styling/placement

## Avoid moving here
- Search drawer internals
- Quick-view modal shell
- Global product-state helpers
