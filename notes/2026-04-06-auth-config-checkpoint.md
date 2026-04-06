# HAVENLY parallel checkpoint — 2026-04-06 auth config + scaffold-target slice

## What changed
- Added a dedicated auth config helper (`src/components/auth-config.js`) so the login flow can resolve its backend target from a small override chain instead of reading one env var inline from `src/main.jsx`.
- The auth target now prefers a runtime-injected config, then an `authApiBaseUrl` query override, then `VITE_AUTH_API_BASE_URL`, and finally `VITE_API_BASE_URL`.
- Extended the auth connection summary to expose whether the frontend is still pointing at the same-origin `/api/auth/*` scaffold, plus which config source selected the current target.
- Tightened the login modal copy so scaffold/network failures now explain that the frontend is still on the placeholder same-origin auth scaffold and can resume the same guest draft once a real backend route or auth base URL is wired.
- Kept the change focused on the login/auth path rather than wider shell refactoring.

## Validation
- `git fetch --all --prune` ✅
- `npm test -- --test-reporter=spec` ✅
- `npm run build` ✅
- Gemini review via `BASE_REF=origin/main npm run review:gemini` ✅
  - Output file: `ai-reviews/gemini-review-2026-04-06_0831UTC.md`
  - Useful takeaway: keep auth slices self-contained and commit the new auth config helper together with the wiring.

## Next smallest checkpoint
1. Reflect the authenticated session summary in one visible shell location beyond the login button (for example, a tiny account/session chip or auth-ready banner).
2. Add one browser smoke around the login modal for runtime/query auth target overrides so deployed base-path builds can be checked quickly.
3. If a backend stub lands, replace the scaffold-only failure path with a concrete success round-trip using the current request/restore payload shape.

## Branch
- `havenly/parallel-loop-2026-04-04`
