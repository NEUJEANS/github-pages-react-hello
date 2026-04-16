# HAVENLY Page 01 · AI Flow

## File
- `src/pages/recommendation-onboarding-pages.jsx`

## Owns
- `AiRecommendPage`
- `SpaceSelectPage`

## User journey
1. User searches/selects apartment info.
2. User chooses connected spaces.
3. User tunes room, style, priority, and lifestyle.
4. AI recommendation cards lead into layout editing.

## Inputs from `main.jsx`
- Navigation + overlay controls
- Auth trigger/session state
- AI form state and setters
- Space profile summary
- Shared catalog constants (`roomOptions`, `styleOptions`, `priorityOptions`, `lifestyleOptions`, `aiProducts`, `apartmentSearchResults`)

## Why this split exists
- Keeps the recommendation/setup funnel separate from commerce and editor concerns.
- Reduces the size of `main.jsx` without changing app-level state ownership.
- Makes the AI funnel easier to iterate on as a pair.

## Safe edits here
- Recommendation form UI
- Space-selection copy/layout
- AI result card presentation
- Room/style/priority interaction polish

## Avoid moving here
- Global auth bootstrap logic
- Shared modal/drawer orchestration
- Cart/session persistence rules
