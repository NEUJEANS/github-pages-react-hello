# HAVENLY auth/layout public backend checklist — 2026-04-14 12:18 UTC

## Goal
Move the live GitHub Pages app from blocked/local-only auth toward a real publicly reachable auth/backend/database path, then validate the saved-layout flow against the deployed site.

## Constraints from live feedback
- GitHub Pages cannot directly call the local loopback auth server from the browser.
- A real public `authApiBaseUrl` is required for live login/session/layout-save.
- Because the frontend is already page-split, keep this slice focused on auth/backend + layout-save modules only.

## Slice checklist
- [ ] Confirm the public-auth blocker boundary from the current code and notes.
- [ ] Make the auth server compatible with credentialed cross-site HTTPS requests from GitHub Pages.
- [ ] Add focused tests for the cookie/session policy needed by a public auth host.
- [ ] Start the sqlite-backed auth server from the main repo/worktree.
- [ ] Expose it through a temporary public HTTPS tunnel for live Pages validation.
- [ ] Push the checkpoint to `origin/main`.
- [ ] Open the deployed GitHub Pages app in Chrome with the runtime `authApiBaseUrl` set to the public tunnel.
- [ ] Test login/auth + related layout save/restore behavior and capture the exact result.
- [ ] Save findings in notes, not chat.

## Working hypothesis
The next real backend blocker is not the database logic itself; it is browser-compatible session transport from a public HTTPS auth host back to the GitHub Pages SPA. The likely missing piece is cross-site cookie policy (`SameSite=None; Secure`) when the auth server is reached through an HTTPS public host.
