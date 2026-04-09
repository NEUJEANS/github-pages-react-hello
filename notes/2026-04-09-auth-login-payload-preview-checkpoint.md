# 2026-04-09 — auth login payload preview checkpoint

## What changed
- added a guarded-login submit payload preview derived from the serialized login handoff summary and canonical auth connection target
- exposed the first login request contract in the modal so the auth-first path now shows the exact backend-facing keys we prepare (`guestDraftSnapshot`, `draftSave`, `intent`, `connection`, etc.) before submit
- kept focused unit coverage around `buildAuthGuardPanelState` to lock the preview shape to the current auth handoff contract

## Why
The continuation/ready flows already showed backend resume payload previews, but the initial login path still made the first auth request feel implicit. This fills a gap in the login logic path: the guarded modal and login form now surface the same serialized draft-save + connection prep that the backend scaffold will receive on the first hop.

## Validation
- `npm test -- --test-name-pattern='buildAuthGuardPanelState|buildAuthReadyPanelState'`
- `npm run build`
- attempted `npm run smoke:auth`, but the smoke runner still hung after preview startup in this environment
- attempted `npm run review:gemini -- --files src/components/auth-session-view-state.js src/components/auth-session-view-state.test.js src/main.jsx` (Gemini CLI completed, but only emitted a generic working-tree review)

## Next auth-first step
- teach the browser smoke to assert the new guarded-login payload preview before clicking through to the form
- then reuse the same preview helper for the non-guard login panel so the first-hop contract stays aligned with continuation previews and backend scaffold wiring
