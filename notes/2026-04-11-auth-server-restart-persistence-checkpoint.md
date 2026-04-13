# HAVENLY parallel checkpoint — 2026-04-11 auth server restart persistence slice

## What changed
- Added focused HTTP-server coverage for the real sqlite-backed auth path across process restarts.
- New restart tests now verify two backend/database-critical flows:
  - a signed-in session cookie still resolves after the auth server restarts against the same sqlite file
  - a pending merge handoff survives restart, can still be read from `/api/auth/pending`, and can be continued into a real session afterward

## Validation
- `git fetch --all --prune` ✅
- `npm test` ✅
- `npm run smoke:auth -- --via-proxy` ✅
- `BASE_REF=HEAD~1 npm run review:gemini` ✅
  - Review file: `ai-reviews/gemini-review-2026-04-11_0806UTC.md`

## Why this matters for login/auth priority
- This tightens the real backend path instead of only the local scaffold path.
- Login state now has explicit regression coverage for the failure mode that matters most for a sqlite-backed auth service: process restarts with existing cookies and pending handoffs still in play.
- It moves the branch closer to “login really works end to end” by checking frontend-facing cookies against the backend/database contract a second time after server restart.

## UI log/defaults check
- No product UI was changed in this slice.
- The existing browser smoke still passed under `--via-proxy`, so this checkpoint did not introduce any visible debug/progress/checklist/log blocks into the UI.

## Next smallest checkpoint
1. Add a browser/proxy auth smoke that explicitly restarts the auth server between login and session bootstrap so the frontend path also proves restart recovery end to end.
2. Add a small helper for launching the proxy auth server with an explicit sqlite file in smoke runs, so restart/recovery scenarios are easier to script.
3. Keep backend auth hardening isolated from the untracked page-split work when committing.
