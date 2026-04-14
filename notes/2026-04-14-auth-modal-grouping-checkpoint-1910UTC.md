# 2026-04-14 19:10 UTC — auth modal grouping checkpoint

## Goal
Continue HAVENLY auth/layout work in the main worktree, but make edits in coherent slices instead of scattered patches.

## Safety / workflow applied
- Followed `github-sync-safety` first: fetched `origin/main`, verified local `main` was aligned before editing.
- Worked page-first: used `docs/HAVENLY_PAGE_02_LAYOUT_EDITOR.md` and the recomposition guide instead of rereading the whole app.
- Kept progress in files, not chat.

## Slice completed
Grouped the auth modal logic into a dedicated component module:
- Added `src/components/auth-modal.jsx`
- Removed the large inline `LoginModal` block from `src/main.jsx`
- Kept the modal in one place with three coherent subviews:
  - guarded login preview
  - action-required continuation panel
  - credentials/signup panel

## Product-facing changes in this slice
- Preserved existing guarded login, merge continuation, profile-completion, email-verification, and post-login resume behaviors.
- Tightened modal button semantics with explicit `type="button"` usage for non-submit actions.
- Kept customer-facing copy intact while avoiding extra debug/status UI in the product surface.
- Slightly clarified alternate auth-mode CTA copy:
  - login mode secondary CTA: `회원가입으로 전환`
  - signup mode secondary CTA: `로그인으로 돌아가기`

## Validation
### Automated
- `npm test` ✅
- `npm run smoke:auth:proxy -- http://127.0.0.1:4180/github-pages-react-hello/` ✅

The proxy-backed browser smoke passed across:
- signup
- direct login
- save-layout continuation
- merge-resolution flow
- complete-profile continuation
- verify-email continuation
- layout tray drag/drop persistence checks
- auth target query/runtime override checks

### Live-site baseline observed before deploy
Running the browser smoke against the currently deployed GitHub Pages site with:
- `https://neujeans.github.io/github-pages-react-hello/?authApiBaseUrl=http%3A%2F%2F127.0.0.1%3A4175`

failed in the signup stage before this checkpoint. That gives a useful pre-deploy comparison point for the next live check after push.

## Files changed in this checkpoint
- `src/main.jsx`
- `src/components/auth-modal.jsx`
- `docs/index.html`
- `docs/assets/*` (rebuilt for Pages)
- `dist/*` (local build output)

## Next recommended step
1. Commit this coherent auth-modal grouping slice.
2. Push `main` to GitHub.
3. Re-run live browser smoke against the deployed Pages site.
4. Use that live result to choose the next auth/backend slice:
   - if live auth now passes with explicit `authApiBaseUrl`, move to persistent production auth wiring/runtime config;
   - if live auth still fails, inspect the live-specific delta (asset/deploy mismatch vs secure-context/private-network/cookie behavior).
