# HAVENLY auth/layout checkpoint — 2026-04-14 13:46 UTC

## Slice
Stabilize the live GitHub Pages auth/layout smoke against the real public auth backend from the main worktree, without widening into unrelated pages.

## Github sync safety
- confirmed `havenly-live` is on `main`
- fetched and verified earlier that local `main` matched `origin/main` before editing
- kept this slice scoped to the live auth/layout smoke flow and related save→reload→switch-context verification

## Live target used
- Pages app: `https://neujeans.github.io/github-pages-react-hello/`
- public auth base: `https://c552963ba43bf2.lhr.life`
- tested URL: `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Fc552963ba43bf2.lhr.life`

Tunnel health at the time of validation:
- `GET /api/auth/health` on the public base ✅

## Coherent group edited
- `scripts/auth-login-smoke.mjs`

## Problem found from live feedback
The previous live failure was not the product state itself anymore; it was the save-draft scenario reading the post-switch layout/auth panel too early after closing the `공간 정보` overlay.

Evidence from the captured live screenshot:
- the layout still showed `101A · 3개 공간 선택`
- the board panel had not yet updated to the switched `84A` context
- this happened immediately after a successful apartment-option click inside the overlay

That pointed to a live timing gap between:
1. the overlay button showing the new apartment selection, and
2. the layout/editor surface plus account-board panel reflecting that selection after the overlay closed.

## What changed
After switching to `래미안 포레스트 84A` in the save-draft scenario, the smoke now waits for the visible layout/editor surface to catch up before asserting drift:
- waits for the live layout meta text to include `84A · 3개 공간 선택`
- waits for the board panel text to include `현재 기준 · 거실 · 84A · 3개 공간 선택`
- only then captures the post-switch screenshot and checks the restore CTA/drift state

This keeps the check aligned with the real user-visible surface rather than only the overlay button state.

## Validation performed
### Targeted validation
- reran live browser smoke directly against the deployed Pages app with the public auth backend override ✅

Command:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Fc552963ba43bf2.lhr.life' --require-browser
```

### Result
The full live browser smoke passed end-to-end:
- signup scenario ✅
- direct login scenario ✅
- save-draft scenario ✅
- merge scenario ✅
- complete-profile scenario ✅
- verify-email scenario ✅
- layout tray drag/abandon scenario ✅
- query override scenario ✅
- runtime override scenario ✅

Key save-draft confirmation from the green pass:
- the live flow now survives save → reload → apartment switch → drift detection → restore
- `계정 저장본 불러오기` becomes enabled after the live context switch as expected
- the post-reload auth/layout flow no longer flakes at that step

## Current state
- public live auth/backend/database path remains healthy
- live Pages auth smoke is green again against a real public backend
- the latest failure was narrowed to smoke timing and has been resolved in the validation harness

## Best next slice
Shift back from smoke stabilization to the next real product-facing auth/layout/backend task, using the same live Pages + public auth validation loop after the next product checkpoint.
