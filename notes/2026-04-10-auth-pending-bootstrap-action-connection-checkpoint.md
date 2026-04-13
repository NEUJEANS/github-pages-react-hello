# 2026-04-10 — auth pending bootstrap action-connection checkpoint

## What changed
- patched the `/api/auth/pending` bootstrap path in `src/main.jsx` so a restored interrupted handoff is rehydrated with both the canonical login connection and the configured continuation/action connection
- persisted that enriched pending handoff back into session storage before rebuilding the login modal resume state
- rebuilt the production bundle and re-ran the auth smoke flow to confirm blocker resumes still expose the configured continuation endpoint

## Why
Pending auth handoffs restored from backend bootstrap could lose the dedicated `/api/auth/continue` target metadata when the payload itself was sparse. That made resumed action-required flows less realistic, especially when runtime/query auth overrides changed the continuation endpoint. Enriching the bootstrapped handoff keeps the frontend ready panel and resume modal aligned with the actual backend continuation contract.

## Validation
- `node --test src/components/auth-flow-state.test.js src/components/auth-storage.test.js src/components/auth-submit.test.js src/components/auth-session-view-state.test.js`
- `npm run smoke:auth`

## Next auth-first step
- add a focused regression assertion around pending-bootstrap resume + continuation endpoint preservation so this integration gap is covered without relying only on the broader smoke script
- then wire one concrete post-auth CTA (`resume-authenticated-flow` or `save-layout-draft`) through the real frontend navigation path instead of preview-only copy
