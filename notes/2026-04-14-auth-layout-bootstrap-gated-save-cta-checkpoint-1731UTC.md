# HAVENLY auth/layout checkpoint — 2026-04-14 17:31 UTC

## Goal
Keep working in the main worktree on a coherent auth/layout slice, focused on the live GitHub Pages layout editor save/login interaction rather than scattered patches.

## Sync / safety first
- worked in `havenly-live` on `main`
- remained aligned with `origin/main` before edits
- ran secret scan before any upload:
  - `npm run security:secrets` ✅

## Relevant page slice chosen
Focused only on the layout editor auth-entry interaction (`src/pages/layout-editor-page.jsx`) plus the auth bootstrap state in `src/main.jsx`.

Reason for choosing this slice:
- live Pages smoke against a fresh public auth backend reached the real deployed app successfully
- signup and direct login already progressed
- the next live blocker happened *before* the auth modal opened from the layout editor: the `로그인 후 보드 저장` CTA detached during click
- this was an auth/bootstrap + layout interaction issue, not a broad app-wide problem

## Live issue reproduced
Stood up a fresh localhost.run tunnel to the sqlite auth server already running on `127.0.0.1:4175`.

Fresh public auth base:
- `https://9e59ad72b4dfe8.lhr.life`

Health check:
- `GET https://9e59ad72b4dfe8.lhr.life/api/auth/health` ✅

Live Pages URL under test:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F9e59ad72b4dfe8.lhr.life#layout`

Reproduced live failure with the repo’s browser smoke:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2F9e59ad72b4dfe8.lhr.life#layout' --require-browser --layout-save-only
```

Observed blocker:
- smoke reached deployed Pages app + real auth backend
- signup scenario passed far enough to continue
- direct login scenario started
- layout save scenario failed when clicking `로그인 후 보드 저장`
- Playwright reported the button repeatedly becoming unstable / detached from the DOM

## Root cause hypothesis
The layout editor exposed the guest save-login CTA immediately, while the app-level auth/session bootstrap effect was still resolving persisted session + pending handoff state.

That meant the guest CTA could be rendered, remounted, or replaced during initial live-page hydration/bootstrap, producing a flaky first click on the real deployed site.

## Coherent code slice edited
### `src/main.jsx`
- added `isAuthBootstrapPending` state
- mark bootstrap pending at the start of the auth session bootstrap effect
- clear it in the effect `finally` path once session/pending bootstrap work settles
- pass the bootstrap state down through shared screen props

### `src/pages/layout-editor-page.jsx`
- grouped the guest layout auth-entry logic into one memoized `guestLayoutAuthAction`
- while auth bootstrap is still pending and no session is active:
  - show a disabled guest action button
  - label: `로그인 준비 중…`
  - helper copy explains that account connection is still being checked
- once bootstrap settles:
  - swap to the real clickable `로그인 후 보드 저장` CTA
  - keep the login intent payload focused on the layout save-draft flow

## Why this product change matters
This is not just a smoke workaround.

For real users on the live GitHub Pages site:
- the layout editor no longer invites a save/login click before auth bootstrap has finished
- the save entry point now reflects actual readiness instead of flashing a clickable control that may remount under the pointer
- the auth/login/backend progression stays centered on the layout editor’s real save flow

## Validation
### Focused tests
```bash
npm test -- --test-name-pattern='layout-auth-panel-state|auth-session-restore|auth-storage|auth-backend-scaffold'
```
Result:
- 258 tests passed
- 0 failed

### Pages build checkpoint
```bash
npm run build:pages
```
Result:
- Pages build completed
- `docs/` synced with fresh build output

### Secret scan before upload
```bash
npm run security:secrets
```
Result:
- no verified or unverified secrets found

## Current state before upload
Implemented locally in main worktree:
- auth bootstrap gating for the layout save-login CTA
- focused tests green
- Pages build refreshed
- fresh public auth tunnel active for live validation

## Next step
Commit + push this slice on `main`, wait for GitHub Pages to update, then rerun the direct live layout-save smoke against:
- deployed Pages app
- fresh public auth backend `https://9e59ad72b4dfe8.lhr.life`

Expected confirmation:
- the live layout editor should no longer surface a detached/unstable `로그인 후 보드 저장` button during initial auth bootstrap
- the smoke should be able to open the auth flow cleanly and continue to the next real auth/layout checkpoint
