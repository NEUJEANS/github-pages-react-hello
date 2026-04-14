# HAVENLY live Pages auth feedback — 2026-04-14 10:42 UTC

## What was tested
After pushing commit `f862819` to `origin/main`, the deployed GitHub Pages URL was opened in a real browser context (local Playwright against the live Pages URL):
- `https://neujeans.github.io/github-pages-react-hello/`

## Result
The deployed site loads, but live auth is still not actually wired for Pages.

Observed live-browser failures:
- `GET https://neujeans.github.io/api/auth/session` → `404`
- `GET https://neujeans.github.io/api/auth/pending` → `404`

## What this means
The auth/layout persistence slice that was just pushed is good, but the live Pages deployment is still using same-origin `/api/auth/*` endpoints on GitHub Pages.

That works in local Vite dev because the auth scaffold/proxy middleware exists there, but GitHub Pages itself cannot serve those backend endpoints.

## Practical next slice
The next coherent auth/backend slice should be production auth wiring for Pages:
1. determine the intended real auth backend/proxy base URL for production, or
2. inject runtime auth config for Pages (`__HAVENLY_AUTH_CONFIG__` / query/env-based base URL), or
3. if no live backend exists yet, make Pages degrade cleanly and explicitly instead of silently probing same-origin `/api/auth/*`.

## Why this matters
The user asked to prioritize real login/auth/backend/database progress and use live deployment feedback after each checkpoint.
This live test shows the next limiting factor is no longer account-state persistence — it is production auth endpoint wiring for the deployed Pages app.
