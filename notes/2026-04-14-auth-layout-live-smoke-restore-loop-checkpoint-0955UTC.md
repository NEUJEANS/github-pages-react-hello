# HAVENLY auth/layout live smoke restore-loop checkpoint — 2026-04-14 09:55 UTC

## Slice
Make the auth/layout smoke loop usable for the requested main-branch GitHub Pages workflow by:
- letting the browser smoke target the deployed Pages URL directly instead of always spawning a local preview
- adding a focused authenticated layout regression for intentional board-context drift followed by restore-from-account

## Why this slice
The recent main-branch work already covered:
- real sqlite/proxy save-context persistence
- reload persistence of apartment/tray/timestamp state
- live deployed verification of authenticated save + reload

But the execution loop still had a practical gap:
- `scripts/auth-login-smoke.mjs` assumed every browser run needed a local preview server
- passing the live Pages URL tried to bind a preview server to the public GitHub Pages IP/port and failed before any real live-site check could start
- the save-layout scenario still stopped at save + reload and did not assert the next highest-value interaction: drift the board context on purpose, then restore from the saved account board

That meant the repo could deploy fine, but the requested push→live-site-feedback loop was weaker than it looked.

## Github sync safety
- verified `/home/user1_admin/.openclaw/workspace/havenly-live` was on `main`
- fetched and confirmed local `main` matched `origin/main` before editing
- kept the change isolated to the auth/layout smoke runner so the checkpoint stayed coherent

## Focused files touched together
- `scripts/auth-login-smoke.mjs`

## What changed
### 1) Remote live URLs now skip local preview boot
The smoke runner now detects whether the supplied base URL is local (`127.0.0.1` / `localhost` / `0.0.0.0`) or remote.

Behavior now:
- local base URLs still build and launch Vite preview as before
- reachable remote URLs are used directly without trying to spawn preview on the remote host/IP
- unreachable remote URLs fail fast with a clear error

This makes commands like:
- `node ./scripts/auth-login-smoke.mjs --require-browser --layout-save-only https://neujeans.github.io/github-pages-react-hello/`
actually exercise the deployed Pages app instead of dying during preview startup.

### 2) Added intentional drift → restore coverage to the save-layout scenario
After the existing authenticated save + reload path, the smoke now:
1. reopens `공간 정보`
2. intentionally switches the apartment away from the saved context
3. verifies the board panel reports drift and exposes the changed current context
4. checks that `계정 저장본 불러오기` becomes enabled
5. clicks restore
6. verifies the board panel returns to the saved context and reports the restored state
7. reopens `공간 정보` to confirm the saved apartment chip is selected again

That turns the save-layout browser smoke into a closer match for the real product loop:
- save to account
- reload authenticated state
- create drift
- restore saved board context back into the layout UI

### 3) Added a focused live verification mode for the layout slice
A lightweight `--layout-save-only` flag now exits after the save-layout scenario.

This is especially useful for deployed Pages checks because it:
- keeps the live verification focused on the active auth/layout checkpoint
- avoids unrelated merge/profile/verification scenarios when the user specifically wants the layout auth loop
- gives a fast direct signal after each push

## Validation
### Local real backend / browser smoke
- `npm run smoke:auth:proxy` ✅
- validated the full proxy-backed suite still passes after the new drift→restore assertions

### Live deployed Pages verification
- `node ./scripts/auth-login-smoke.mjs --require-browser --layout-save-only https://neujeans.github.io/github-pages-react-hello/` ✅
- confirmed the deployed site supports the focused authenticated save-layout continuation path with live browser automation
- the live run now reaches the save-layout scenario directly instead of failing during preview startup

## Next likely slice
Now that the deploy/live verification loop is actually usable from the main branch, the next auth/backend/layout slice should go back to product behavior, not tooling:
- carry the same drift→restore assertion into the live deployed check after the next app-state change on `main`
- push further on real sqlite/proxy parity for restore semantics beyond apartment context
- if a concrete restore mismatch appears on live Pages, fix that in the page/auth modules as one coherent slice and validate again with the focused live smoke command
