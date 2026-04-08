# 2026-04-08 auth scaffold handoff header fix checkpoint

## What changed
- Restored the Vite auth scaffold middleware after a review-tool overwrite and fixed the real auth-path bug blocking same-origin scaffold responses.
- Imported `AUTH_HANDOFF_HEADER` into `vite.config.js` so scaffold session/pending/login responses can emit the serialized handoff header without throwing at runtime.
- Revalidated the auth-focused branch state with the existing component test suite and a fresh production build.

## Why it matters
- The login modal / guarded login / pending handoff flow depends on the dev+preview scaffold returning handoff and continuation metadata cleanly.
- Without the missing import, the scaffold middleware could crash while building auth continuation headers, which blocks realistic frontend-to-backend-scaffold login wiring.
- This keeps the current next step pointed at actual auth flow wiring instead of generic refactor work.

## Validation
- `npm test`
- `npm run build`

## Next smallest auth-first step
- Run the auth smoke against a live preview/dev server and fix any remaining scaffold/runtime mismatch in the login modal ready path.
- Then tighten the frontend ready-panel CTA path around backend `nextAction` values and any action-required screens.
