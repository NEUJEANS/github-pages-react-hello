# HAVENLY auth/layout checkpoint — 2026-04-14 04:51 UTC

## Slice completed
Restored full authenticated board continuity during client hydration by reapplying persisted recommendation-tray snapshots anywhere account state is rehydrated, not just during the explicit in-page restore button flow.

## What changed
- `src/components/auth-account-continuity.js`
  - added a focused helper to clone persisted account continuity state in one place.
  - preserves wishlist/cart/layout/recommendation state and explicitly preserves `layoutTrayItems`, including an intentionally empty `[]` tray snapshot.
- `src/components/auth-account-continuity.test.js`
  - added targeted coverage for cloned continuity state, explicit empty tray preservation, and omission when tray state was never persisted.
- `src/components/auth-session-merge.js`
  - now reuses the shared continuity helper for post-login replacement hydration instead of manually rebuilding only part of the account snapshot.
- `src/main.jsx`
  - bootstrap/session-restore hydration now reapplies persisted `layoutTrayItems` when account state includes them.
  - merge-replacement hydration after login/signup continuation now reapplies persisted `layoutTrayItems` too.
  - kept recommendation-draft/layout restore behavior intact while closing the tray-only continuity gap.

## Why this mattered
The backend/sqlite path was already persisting recommendation-tray state correctly, and the explicit “계정 저장본 불러오기” action restored it. But the broader authenticated hydration paths still dropped the tray snapshot when the app re-bootstrapped from a saved auth session or when account state replaced guest state after auth.

That meant a user could save a board with account-backed tray changes, refresh/reopen/log in successfully, and still land in a mismatched board state even though the database had the right tray snapshot.

This checkpoint aligns client hydration with what the backend actually persists.

## Validation
- Secret scan before upload:
  - `npm run security:secrets`
  - green
- Targeted/full tests:
  - `npm test -- src/components/auth-account-continuity.test.js src/components/auth-session-merge.test.js`
  - package test expansion green (all component/server tests passed)
- Production build:
  - `npm run build`
  - green

## Next live verification target
After push / GitHub Pages deploy, verify a real account-backed tray continuity path on the live site:
1. authenticate
2. change tray state without necessarily changing placed items
3. save board
4. hard refresh or re-enter with restored session
5. confirm tray state still matches account-backed saved state

If live behavior is green, the next auth/layout/backend slice should likely focus on clearer account-saved board metadata in the layout panel or expanding smoke coverage for authenticated tray continuity.