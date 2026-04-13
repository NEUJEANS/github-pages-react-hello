# 2026-04-11 auth real-backend smoke default

- Switched `npm run smoke:auth` to use `--require-browser --via-proxy` by default so the standard auth smoke now exercises the separate auth HTTP backend, cookie/session flow, and sqlite-backed persistence instead of only the in-app scaffold path.
- Kept the old scaffold-only path available as `npm run smoke:auth:scaffold` for fast local debugging when the full backend path is not needed.
- Re-ran the browser smoke against both the default path and the explicit proxy path to confirm signup, direct login, merge continuation, profile completion, and email verification still work end to end.
- Re-checked the login modal UI during smoke output to make sure it still avoids visible debug/progress/checklist/log blocks in customer-facing auth surfaces.
