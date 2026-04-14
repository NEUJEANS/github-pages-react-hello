# HAVENLY live Pages check — 2026-04-14 14:19 UTC

## Deployed checkpoint under test
- commit: `2387c4a`
- message: `Preserve auth continuation intent across profile completion`
- live URL: `https://neujeans.github.io/github-pages-react-hello/`

## What was verified live
### 1) GitHub Pages is serving the new checkpoint
Direct fetch of the live HTML shows the new pushed bundle:
- `assets/index-D-pFMmVn.js`

Response headers also showed a fresh deploy timestamp matching the push window.

### 2) Real local auth backend is available on this machine
Confirmed locally before browser probing:
- `http://127.0.0.1:4175/api/auth/health`
- response: `{ ok: true, storage: "sqlite" }`

This means the live Pages app should be able to exercise a real auth/backend/database path from this machine through the runtime loopback detection logic.

### 3) Live browser-rendered app loads correctly
Headless Playwright check against the live URL confirmed:
- page title renders
- top-level navigation renders
- login button renders
- screenshot saved:
  - `playwright-artifacts/live-pages-checkpoint-1415.png`

### 4) Login guard modal still opens on the live site
A narrower live browser pass confirmed:
- clicking `로그인` opens the login-guard modal first
- clicking `로그인 계속하기` reaches the login form state
- screenshot saved:
  - `playwright-artifacts/live-pages-login-modal-1417.png`

## Important live finding
The next blocker appears to be inside the auth modal interaction itself, not in deployment:
- the modal contains duplicate button labels (`로그인`, `회원가입`) because the mode switch and submit controls use overlapping names
- broad smoke selectors are therefore brittle here
- even with a scoped CTA probe in the modal, the narrowed browser script did not observe a submit/network transition after filling valid credentials
- no `/api/auth/*` browser response events were observed in that narrowed probe

## What this likely means
The continuation-intent checkpoint is definitely deployed, but the next concrete boundary is still earlier in the modal flow than the intended `complete-profile` handoff assertion.

The most likely remaining issue is one of:
1. modal submit interaction/state wiring is still brittle in the deployed UI after the guard → form transition, or
2. browser automation is still targeting the wrong in-modal control because of duplicated labels / ambiguous structure.

## Evidence captured
- `playwright-artifacts/live-pages-checkpoint-1415.png`
- `playwright-artifacts/live-pages-login-modal-1417.png`
- `playwright-artifacts/live-pages-profile-flow-1417.png`
- `playwright-artifacts/live-pages-profile-flow-scoped-1418.png`
- `playwright-artifacts/live-pages-profile-flow-cta-1418.png`

## Recommended next coherent slice
Keep the next edit tightly centered on auth modal composition and interaction wiring only:
- inspect the login modal/footer/button structure in `src/main.jsx`
- separate mode-switch controls from submit CTA semantics more clearly
- reduce duplicate accessible button names inside the modal where practical
- then re-run the live profile/login branch to get back to the real `complete-profile` blocker path
