# 2026-04-10 — persisted continuation connection checkpoint

## What changed
- persisted a dedicated `actionConnection` alongside the existing login `connection` in auth handoff/session storage
- threaded that persisted continuation target through bootstrap, login submit, and continuation submit flows in `main.jsx`
- taught ready/resume panel state to fall back to the persisted continuation endpoint when action-required auth resumes reopen after reload or config drift
- added focused tests covering storage persistence and UI preview fallback for the continuation connection contract

## Why
The login/auth path already remembered the login endpoint, but action-required flows (`complete-profile`, `verify-email`, `confirm-merge-resolution`) can depend on a different backend continuation target. Persisting that second connection keeps the frontend’s resume contract aligned with the backend scaffold even when the page reloads or the runtime wiring changes.

## Validation
- `node --test src/components/auth-storage.test.js src/components/auth-session-view-state.test.js src/components/auth-flow-state.test.js src/components/auth-submit.test.js`
- Gemini review script was invoked for the touched files; it produced a broad review artifact, with the useful takeaway being to keep watch on growing `main.jsx` auth complexity while continuing auth-first wiring work.

## Next smallest auth-first step
- use the persisted continuation connection in browser smoke assertions so action-required resume previews prove they keep the same backend continuation target across reloads
- then start narrowing the gap between the current scaffold continuation contract and a real backend-backed session source
