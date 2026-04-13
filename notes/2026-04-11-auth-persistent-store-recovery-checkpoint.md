# 2026-04-11 auth persistent store recovery checkpoint

## What changed
- Recovered `server/auth-persistent-store.js` after the branch tip had an invalid non-JS blob at the file path.
- Restored the sqlite-backed auth store implementation from the last good auth persistence revision and re-added the newer `readAuthStorePaths()` export expected by the standalone auth HTTP server and tests.
- Updated the store to honor `HAVENLY_AUTH_DATA_DIR` and `HAVENLY_AUTH_SQLITE_PATH` overrides while safely reopening the sqlite connection if the resolved database path changes between runs.

## Validation
- `npm test`
- `npm run build`
- `npm run smoke:auth:proxy`
- Gemini review saved to `ai-reviews/gemini-review-2026-04-11_0107UTC.md`

## No-log-ui-defaults check
- Re-checked for visible auth debug/report/checklist blocks while running the browser smoke flow.
- No new auth progress/debug/report UI blocks were added in this checkpoint.

## Next
- Keep pushing the real auth branch toward production wiring, especially reducing scaffold/dev-server coupling once the actual backend contract is ready.
- Consider the next structural checkpoint Gemini called out: move newly introduced page splits out of `main.jsx` and commit the untracked page/doc files cleanly.
