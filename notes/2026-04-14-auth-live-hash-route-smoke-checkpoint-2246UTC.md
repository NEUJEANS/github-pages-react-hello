# 2026-04-14 22:46 UTC — auth live hash-route smoke checkpoint

## Goal
Close out the in-progress main-worktree auth slice, deploy it from `main`, and use live-site feedback to select the next coherent auth/layout slice.

## Workflow / constraints followed
- Applied `github-sync-safety` first: verified `havenly-live` `main` matched `origin/main` before building on the current local change.
- Stayed page-first: used the layout editor page doc instead of reloading the whole app.
- Kept work in a coherent slice focused on auth smoke + deploy feedback, not scattered UI edits.
- Preserved `no-log-ui-defaults`: no product-facing debug/report UI added.

## Slice completed
Finished and validated the pending smoke harness update that normalizes hash-route navigation under configurable base URLs.

### Why this was needed
The smoke harness previously constructed URLs like:
- `${baseUrl}#layout`

That is brittle when `baseUrl` already contains search params or when the base path handling changes. The harness now centralizes route construction via a helper so all hash-route entries are derived from the canonical base URL.

### Files changed
- `scripts/auth-login-smoke.mjs`
  - added `withBaseUrlHash(hash)` helper
  - switched hash-route entrypoints in the signup / save-layout / tray-drag scenarios to use the shared helper

## Validation
### Targeted tests
```bash
npm test -- --test-name-pattern='shouldAutoResumeReadyAuthModal|buildAuthResultSummary preserves the existing account label and session id when continuation responses omit them'
```
Result:
- 260 tests passed
- 0 failed

### Full local browser smoke through proxy-backed backend
```bash
npm run smoke:auth:proxy -- http://127.0.0.1:4180/github-pages-react-hello/
```
Result:
- passed
- browser scenarios completed through signup, direct login, save-layout continuation, merge handling, complete-profile, verify-email, tray drag/drop metrics, and auth target overrides

### Build + secret scan
```bash
npm run build:pages
npm run security:secrets
```
Result:
- `docs/` synced from current build output
- trufflehog found 0 verified / 0 unverified secrets

## Live-site next step
1. Commit this coherent smoke/deploy slice on `main`.
2. Push to GitHub.
3. Test the deployed Pages site with the browser-backed smoke path against the live URL.
4. Use that live result to choose the next auth/backend/layout slice.
