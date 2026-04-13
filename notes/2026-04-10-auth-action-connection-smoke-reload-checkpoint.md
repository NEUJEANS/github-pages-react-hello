# 2026-04-10 — auth action connection smoke reload checkpoint

## What changed
- tightened the browser auth smoke helper with explicit continuation-endpoint extraction from the action-required payload preview
- added reload-stability assertions for both `complete-profile` and `verify-email` flows so they now fail if the persisted continuation target drifts across reloads
- surfaced the captured continuation endpoint before and after reload in the smoke output to make backend-connection debugging easier

## Why
The frontend already persists a dedicated action/continuation connection for resumable auth work. This checkpoint makes the smoke flow prove that persistence end-to-end in the browser, which is the next safe step before replacing more of the scaffold with a real backend session source.

## Validation
- `node ./scripts/auth-login-smoke.mjs`
- `BASE_REF=origin/main ./scripts/gemini-review.sh`

## Gemini takeaway
- the review did not flag the new smoke assertions as risky; the useful direction remains to keep auth work incremental and continue closing the gap between scaffolded resume flows and a real backend-backed session source

## Next smallest auth-first step
- thread a real session/bootstrap response fixture or adapter into the scaffold path so the browser smoke can distinguish "scaffold fallback" from "backend-backed session" on reload
- or add a similarly explicit smoke assertion for the pending bootstrap path so resumed handoffs prove they keep the persisted continuation endpoint before login modal reopen
