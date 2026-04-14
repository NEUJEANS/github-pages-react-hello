# HAVENLY live Pages public-auth validation — 2026-04-14 12:23 UTC

## Live target
- Pages app: `https://neujeans.github.io/github-pages-react-hello/`
- runtime auth base: `https://c2b93f25927b8c.lhr.life`
- full tested URL: `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Fc2b93f25927b8c.lhr.life`

## Important setup note
The first live retry still failed because the localhost.run tunnel was serving an older auth server process that was started before the cookie-policy fix.

After killing the stale process and restarting the standalone backend from the updated main worktree, the public tunnel began returning the expected cookies:
- `SameSite=None`
- `Secure`

Verified directly with:
- `POST https://c2b93f25927b8c.lhr.life/api/auth/signup` + `Origin: https://neujeans.github.io`

## Live browser smoke result
Used the repo’s Playwright smoke path against the deployed Pages URL with the runtime public auth base override.

Command:
```bash
node ./scripts/auth-login-smoke.mjs 'https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=https%3A%2F%2Fc2b93f25927b8c.lhr.life' --require-browser
```

### Progress reached before failure
The smoke advanced through these live auth slices successfully enough to continue past earlier blockers:
- `signup-scenario:start`
- `direct-login-scenario:start`
- `save-draft-scenario:start`
- `merge-scenario:start`
- `complete-profile-scenario:start`

This is meaningful progress versus the earlier live state where Pages auth failed immediately because no real backend/session path existed.

### Current failure
The smoke now fails late in the flow at:
- `complete-profile-scenario:start`

Timeout:
- waiting for button `프로필 보완 제출`

## Observed UI artifact
Saved screenshot:
- `playwright-artifacts/auth-login-complete-profile-ready.png`

The screenshot shows:
- the user appears logged in (`Havenly User` visible in the header)
- a top auth/session notice is present
- the app appears to have advanced to a ready/account-connected state
- but the smoke did not find the expected explicit complete-profile CTA button/modal

## What this suggests
The public live auth/session path is now substantially working:
- live Pages can reach a real public backend
- cross-site auth cookies now persist correctly
- the flow progresses through signup/login/save/merge farther than before

The next concrete issue is narrower:
- either the complete-profile continuation UI is not surfacing in the expected place/state for the live flow, or
- the smoke script’s expectation is stale relative to the current UI presentation.

## Next coherent slice
Focus only on the action-required continuation presentation around `complete-profile`:
1. inspect the auth-ready/session-notice presentation logic and the smoke expectation
2. determine whether the bug is product UI state vs smoke-script assumption
3. if it is product UI, fix the continuation entry point coherently in the auth-ready/session-notice modules
4. push and re-run the live public-auth smoke against Pages again
