# 2026-04-06 auth continuation scaffold checkpoint

## What changed
- Expanded the local auth scaffold contract so it now emits backend-style continuation hints (`resumeToken`, `nextAction`) on the auth paths the frontend already understands.
- `POST /api/auth/login`
  - invalid credentials now return `retry-login` continuation metadata
  - merge-conflict responses now return `confirm-merge-resolution`
  - successful auth sessions now retain a resume token and the next action derived from the login intent or merge resolution
- `GET /api/auth/session` now preserves the scaffold session continuation metadata when a session exists, and returns a small `login-required` next action when no scaffold session exists.

## Why this step
- Keeps the login modal's continuation UI honest against a more realistic backend-shaped contract.
- Gives the scaffold a clearer handoff/resume story before wiring a real backend.
- Small enough to validate safely without changing the broader UI flow.

## Validation
- `npm test`
- `npm run build`
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/`
- Gemini review attempted via `npm run review:gemini`, but the CLI stalled after cached credential load and produced no review output.

## Likely next step
- Surface scaffold continuation metadata more explicitly in the persisted auth session/banner or extend the scaffold plugin to emit header-level continuation hints too, so the frontend can validate both body and header contract paths before a real backend arrives.
