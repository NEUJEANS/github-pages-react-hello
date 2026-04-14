# HAVENLY auth/layout live deploy lag note — 2026-04-14 05:12 UTC

## What happened
After shipping `da66bca` (`auth: clarify saved vs current layout board state`), GitHub Actions reported the Pages deploy workflow as completed successfully:
- run: `24382008170`
- sha: `da66bca`
- conclusion: `success`

But repeated live-browser checks still served the previous production bundle:
- live script src: `/github-pages-react-hello/assets/index-Dp9eRo5L.js`
- expected new bundle from local build: `index-B6BjmI9R.js`

## Live verification attempted
Used Playwright directly against:
- `https://neujeans.github.io/github-pages-react-hello/#layout`

Repeated checks confirmed:
- the layout page loads
- the right-side layout panel is still rendering the previous copy
- the new saved-vs-current account-board copy is not on the live site yet

## Why this matters
The requested loop depends on pushing each checkpoint and then using live deployed behavior to guide the next slice.
Right now GitHub Pages propagation is lagging behind the successful workflow run, so the deployed site cannot yet provide trustworthy feedback for the latest checkpoint.

## Current state
- local source/test/build for this slice: green
- push to `origin/main`: complete
- GitHub Actions Pages deploy: green
- live site content: still stale at time of check

## Next action when the live bundle updates
Re-run the live auth/layout pass once the site stops serving `index-Dp9eRo5L.js`, then verify:
1. authenticated layout panel shows both saved and current board counts
2. drift copy appears after tray/layout changes
3. save + refresh returns the panel to the saved/matching-state copy when continuity is correct
