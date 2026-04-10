# Gemini Review

- Generated: Fri Apr 10 12:09:43 PM UTC 2026
- Branch: havenly/parallel-loop-2026-04-04
- Base: origin/main

## havenly/parallel-loop-2026-04-04...origin/havenly/parallel-loop-2026-04-04 [ahead 56]
 M dist/index.html
 M node_modules/.package-lock.json
 M package.json
 M scripts/auth-login-smoke.mjs
?? --files
?? .data/
?? CLEANUP_CHECKPOINT_havenly_parallel_cleanup.md
?? server/auth-http-server.js
?? server/auth-http-server.test.js

## Changed files

.gitignore
CHECKPOINT_PLAN_2026-04-04.md
WORKFLOW_PARALLEL_LOOP.md
ai-reviews/gemini-review-2026-04-05_1127UTC.md
ai-reviews/gemini-review-2026-04-06_0703UTC.md
dist/index.html
docs/assets/index-D6n2aJa8.css
docs/assets/index-DArgC09m.js
docs/assets/index-DltTpeTB.js
docs/assets/index-W7M3e0EU.css
docs/index.html
node_modules/.package-lock.json
notes/2026-04-04-input-structure-checkpoint.md
notes/2026-04-04-priority-lifestyle-controls-checkpoint.md
notes/2026-04-04-runtime-brief-checkpoint.md
notes/2026-04-05-ai-apply-to-layout-checkpoint.md
notes/2026-04-05-ai-recommendation-state-checkpoint.md
notes/2026-04-05-ai-room-availability-checkpoint.md
notes/2026-04-05-ai-space-summary-checkpoint.md
notes/2026-04-05-app-state-checkpoint.md
notes/2026-04-05-bed-filter-state-checkpoint.md
notes/2026-04-05-cart-state-checkpoint.md
notes/2026-04-05-editor-state-checkpoint.md
notes/2026-04-05-editor-state-consumers-checkpoint.md
notes/2026-04-05-layout-add-to-layout-handler-checkpoint.md
notes/2026-04-05-layout-editor-action-metadata-checkpoint.md
notes/2026-04-05-layout-editor-color-options-checkpoint.md
notes/2026-04-05-layout-editor-command-helpers-checkpoint.md
notes/2026-04-05-layout-editor-command-runner-checkpoint.md
notes/2026-04-05-layout-editor-consumer-wiring-checkpoint.md
notes/2026-04-05-layout-editor-hint-state-checkpoint.md
notes/2026-04-05-layout-editor-property-panel-actions-checkpoint.md
notes/2026-04-05-layout-editor-property-panel-state-checkpoint.md
notes/2026-04-05-layout-editor-render-state-checkpoint.md
notes/2026-04-05-layout-editor-selection-snapshot-checkpoint.md
notes/2026-04-05-layout-editor-toolbar-checkpoint.md
notes/2026-04-05-layout-editor-undo-availability-checkpoint.md
notes/2026-04-05-layout-editor-unhandled-command-warning-checkpoint.md
notes/2026-04-05-layout-editor-view-state-checkpoint.md
notes/2026-04-05-layout-library-empty-state-checkpoint.md
notes/2026-04-05-layout-library-import-fix-checkpoint.md
notes/2026-04-05-layout-library-state-checkpoint.md
notes/2026-04-05-login-guard-continuity-checkpoint.md
notes/2026-04-05-navigation-state-checkpoint.md
notes/2026-04-05-product-flow-state-checkpoint.md
notes/2026-04-05-search-drawer-polish-checkpoint.md
notes/2026-04-05-search-drawer-wiring-checkpoint.md
notes/2026-04-05-shared-space-profile-checkpoint.md
notes/2026-04-05-space-profile-component-checkpoint.md
notes/2026-04-05-space-profile-module-checkpoint.md
notes/2026-04-05-space-profile-state-checkpoint.md
notes/2026-04-05-space-summary-coverage-checkpoint.md
notes/2026-04-05-wishlist-state-checkpoint.md
notes/2026-04-06-auth-backend-scaffold-checkpoint.md
notes/2026-04-06-auth-bootstrap-connection-checkpoint.md
notes/2026-04-06-auth-bootstrap-logout-smoke-checkpoint.md
notes/2026-04-06-auth-config-checkpoint.md
notes/2026-04-06-auth-connection-context-checkpoint.md
notes/2026-04-06-auth-continuation-scaffold-checkpoint.md
notes/2026-04-06-auth-login-smoke-checkpoint.md
notes/2026-04-06-auth-merge-confirmation-checkpoint.md
notes/2026-04-06-auth-merge-options-contract-checkpoint.md
notes/2026-04-06-auth-merge-replace-checkpoint.md
notes/2026-04-06-auth-restore-summary-checkpoint.md
notes/2026-04-06-auth-resume-connection-checkpoint.md
notes/2026-04-06-auth-resume-contract-checkpoint.md
notes/2026-04-06-auth-session-banner-checkpoint.md
notes/2026-04-06-auth-session-bootstrap-checkpoint.md
notes/2026-04-06-auth-session-draft-context-checkpoint.md
notes/2026-04-06-auth-session-modal-bootstrap-checkpoint.md
notes/2026-04-06-auth-session-replace-hydration-checkpoint.md
notes/2026-04-06-auth-session-reset-checkpoint.md
notes/2026-04-06-auth-storage-checkpoint.md
notes/2026-04-06-auth-submit-scaffold-fallback-checkpoint.md
notes/2026-04-06-layout-editor-command-handler-map-checkpoint.md
notes/2026-04-06-login-auth-handoff-checkpoint.md
notes/2026-04-06-login-resume-error-state-checkpoint.md
notes/2026-04-07-auth-action-required-ready-panel-checkpoint.md
notes/2026-04-07-auth-continuation-retry-checkpoint.md
notes/2026-04-07-auth-ready-next-action-checkpoint.md
notes/2026-04-07-auth-ready-panel-resume-checkpoint.md
notes/2026-04-07-auth-same-origin-connection-checkpoint.md
notes/2026-04-08-auth-action-required-modal-resume-checkpoint.md
notes/2026-04-08-auth-action-required-smoke-checkpoint.md
notes/2026-04-08-auth-basepath-connection-summary-checkpoint.md
notes/2026-04-08-auth-blocker-only-resume-checkpoint.md
notes/2026-04-08-auth-bootstrap-password-shape-checkpoint.md
notes/2026-04-08-auth-browser-smoke-resilience-checkpoint.md
notes/2026-04-08-auth-continuation-account-fallback-checkpoint.md
notes/2026-04-08-auth-continue-middleware-checkpoint.md
notes/2026-04-08-auth-header-encoding-checkpoint.md
notes/2026-04-08-auth-keep-resumable-login-modal-open-checkpoint.md
notes/2026-04-08-auth-scaffold-handoff-header-fix-checkpoint.md
notes/2026-04-09-auth-browser-ready-signal-checkpoint.md
notes/2026-04-09-auth-connection-drift-checkpoint.md
notes/2026-04-09-auth-continuation-endpoint-preview-checkpoint.md
notes/2026-04-09-auth-draftsave-ui-handoff-checkpoint.md
notes/2026-04-09-auth-guard-browser-smoke-checkpoint.md
notes/2026-04-09-auth-guard-handoff-visibility-checkpoint.md
notes/2026-04-09-auth-login-draftsave-submit-checkpoint.md
notes/2026-04-09-auth-login-panel-preview-checkpoint.md
notes/2026-04-09-auth-login-payload-preview-checkpoint.md
notes/2026-04-09-auth-merge-blocker-status-checkpoint.md
notes/2026-04-09-auth-response-contract-preview-checkpoint.md
notes/2026-04-09-auth-resume-modal-reopen-checkpoint.md
notes/2026-04-09-auth-wiring-card-checkpoint.md
notes/2026-04-10-auth-action-connection-smoke-reload-checkpoint.md
notes/2026-04-10-auth-browser-override-smoke-stability-checkpoint.md
notes/2026-04-10-auth-no-log-ui-browser-smoke-checkpoint.md
notes/2026-04-10-auth-override-continuation-smoke-checkpoint.md
notes/2026-04-10-auth-pending-bootstrap-action-connection-checkpoint.md
notes/2026-04-10-auth-persisted-continuation-connection-checkpoint.md
notes/2026-04-10-auth-vite-proxy-checkpoint.md
package.json
scripts/auth-login-smoke.mjs
scripts/gemini-review.sh
server/auth-persistent-store.js
server/auth-persistent-store.test.js
src/components/ai-recommendation-state.js
src/components/ai-recommendation-state.test.js
src/components/app-state.js
src/components/app-state.test.js
src/components/auth-backend-scaffold.js
src/components/auth-backend-scaffold.test.js
src/components/auth-bootstrap-state.js
src/components/auth-bootstrap-state.test.js
src/components/auth-config.js
src/components/auth-config.test.js
src/components/auth-flow-state.js
src/components/auth-flow-state.test.js
src/components/auth-intent-state.js
src/components/auth-intent-state.test.js
src/components/auth-session-merge.js
src/components/auth-session-merge.test.js
src/components/auth-session-restore.js
src/components/auth-session-restore.test.js
src/components/auth-session-view-state.js
src/components/auth-session-view-state.test.js
src/components/auth-storage.js
src/components/auth-storage.test.js
src/components/auth-submit.js
src/components/auth-submit.test.js
src/components/auth-wiring-state.js
src/components/auth-wiring-state.test.js
src/components/bed-filter-state.js
src/components/bed-filter-state.test.js
src/components/cart-state.js
src/components/cart-state.test.js
src/components/editor-state.js
src/components/editor-state.test.js
src/components/layout-editor-command-handlers.js
src/components/layout-editor-command-handlers.test.js
src/components/layout-editor-command-runner.js
src/components/layout-editor-command-runner.test.js
src/components/layout-editor-view-state.js
src/components/layout-editor-view-state.test.js
src/components/layout-library-state.js
src/components/layout-library-state.test.js
src/components/login-guard.js
src/components/login-guard.test.js
src/components/navigation-state.js
src/components/navigation-state.test.js
src/components/product-flow-state.js
src/components/product-flow-state.test.js
src/components/search-drawer.js
src/components/search-drawer.test.js
src/components/space-profile-state.js
src/components/space-profile-state.test.js
src/components/space-profile.jsx
src/components/space-summary.js
src/components/space-summary.test.js
src/components/wishlist-state.js
src/components/wishlist-state.test.js
src/main.jsx
src/styles.css
vite.config.js

## Untracked files

--files
.data/havenly-auth-store.json
.data/havenly-auth-store.sqlite
.data/havenly-auth-store.sqlite-shm
.data/havenly-auth-store.sqlite-wal
CLEANUP_CHECKPOINT_havenly_parallel_cleanup.md
server/auth-http-server.js
server/auth-http-server.test.js

## Diffstat

 .gitignore                                         |    1 +
 CHECKPOINT_PLAN_2026-04-04.md                      |   70 +
 WORKFLOW_PARALLEL_LOOP.md                          |  134 ++
 ai-reviews/gemini-review-2026-04-05_1127UTC.md     |   50 +
 ai-reviews/gemini-review-2026-04-06_0703UTC.md     |  225 ++
 dist/index.html                                    |    4 +-
 docs/assets/index-D6n2aJa8.css                     |    1 +
 docs/assets/index-DArgC09m.js                      |    9 +
 docs/assets/index-DltTpeTB.js                      |    9 -
 docs/assets/index-W7M3e0EU.css                     |    1 -
 docs/index.html                                    |    4 +-
 node_modules/.package-lock.json                    |   32 +
 notes/2026-04-04-input-structure-checkpoint.md     |   29 +
 ...04-04-priority-lifestyle-controls-checkpoint.md |   21 +
 notes/2026-04-04-runtime-brief-checkpoint.md       |   17 +
 notes/2026-04-05-ai-apply-to-layout-checkpoint.md  |   23 +
 ...026-04-05-ai-recommendation-state-checkpoint.md |   24 +
 .../2026-04-05-ai-room-availability-checkpoint.md  |   23 +
 notes/2026-04-05-ai-space-summary-checkpoint.md    |   23 +
 notes/2026-04-05-app-state-checkpoint.md           |   22 +
 notes/2026-04-05-bed-filter-state-checkpoint.md    |   22 +
 notes/2026-04-05-cart-state-checkpoint.md          |   21 +
 notes/2026-04-05-editor-state-checkpoint.md        |   21 +
 ...2026-04-05-editor-state-consumers-checkpoint.md |   21 +
 ...4-05-layout-add-to-layout-handler-checkpoint.md |   27 +
 ...-05-layout-editor-action-metadata-checkpoint.md |   21 +
 ...04-05-layout-editor-color-options-checkpoint.md |   22 +
 ...-05-layout-editor-command-helpers-checkpoint.md |   27 +
 ...4-05-layout-editor-command-runner-checkpoint.md |   21 +
 ...-05-layout-editor-consumer-wiring-checkpoint.md |   24 +
 ...26-04-05-layout-editor-hint-state-checkpoint.md |   23 +
 ...out-editor-property-panel-actions-checkpoint.md |   24 +
 ...ayout-editor-property-panel-state-checkpoint.md |   21 +
 ...-04-05-layout-editor-render-state-checkpoint.md |   23 +
 ...-layout-editor-selection-snapshot-checkpoint.md |   25 +
 .../2026-04-05-layout-editor-toolbar-checkpoint.md |   22 +
 ...5-layout-editor-undo-availability-checkpoint.md |   26 +
 ...-editor-unhandled-command-warning-checkpoint.md |   21 +
 ...26-04-05-layout-editor-view-state-checkpoint.md |   22 +
 ...-04-05-layout-library-empty-state-checkpoint.md |   23 +
 ...6-04-05-layout-library-import-fix-checkpoint.md |   21 +
 .../2026-04-05-layout-library-state-checkpoint.md  |   22 +
 ...2026-04-05-login-guard-continuity-checkpoint.md |   24 +
 notes/2026-04-05-navigation-state-checkpoint.md    |   21 +
 notes/2026-04-05-product-flow-state-checkpoint.md  |   25 +
 .../2026-04-05-search-drawer-polish-checkpoint.md  |   25 +
 .../2026-04-05-search-drawer-wiring-checkpoint.md  |   23 +
 .../2026-04-05-shared-space-profile-checkpoint.md  |   22 +
 ...026-04-05-space-profile-component-checkpoint.md |   22 +
 .../2026-04-05-space-profile-module-checkpoint.md  |   23 +
 notes/2026-04-05-space-profile-state-checkpoint.md |   24 +
 ...2026-04-05-space-summary-coverage-checkpoint.md |   24 +
 notes/2026-04-05-wishlist-state-checkpoint.md      |   23 +
 .../2026-04-06-auth-backend-scaffold-checkpoint.md |   27 +
 ...6-04-06-auth-bootstrap-connection-checkpoint.md |   26 +
 ...04-06-auth-bootstrap-logout-smoke-checkpoint.md |   28 +
 notes/2026-04-06-auth-config-checkpoint.md         |   24 +
 ...026-04-06-auth-connection-context-checkpoint.md |   22 +
 ...-04-06-auth-continuation-scaffold-checkpoint.md |   23 +
 notes/2026-04-06-auth-login-smoke-checkpoint.md    |   23 +
 ...026-04-06-auth-merge-confirmation-checkpoint.md |   26 +
 ...04-06-auth-merge-options-contract-checkpoint.md |   21 +
 notes/2026-04-06-auth-merge-replace-checkpoint.md  |   24 +
 .../2026-04-06-auth-restore-summary-checkpoint.md  |   26 +
 ...2026-04-06-auth-resume-connection-checkpoint.md |   22 +
 .../2026-04-06-auth-resume-contract-checkpoint.md  |   22 +
 notes/2026-04-06-auth-session-banner-checkpoint.md |   22 +
 ...2026-04-06-auth-session-bootstrap-checkpoint.md |   26 +
 ...-04-06-auth-session-draft-context-checkpoint.md |   26 +
 ...4-06-auth-session-modal-bootstrap-checkpoint.md |   20 +
 ...06-auth-session-replace-hydration-checkpoint.md |   30 +
 notes/2026-04-06-auth-session-reset-checkpoint.md  |   30 +
 notes/2026-04-06-auth-storage-checkpoint.md        |   24 +
 ...-06-auth-submit-scaffold-fallback-checkpoint.md |   15 +
 ...layout-editor-command-handler-map-checkpoint.md |   21 +
 notes/2026-04-06-login-auth-handoff-checkpoint.md  |   25 +
 ...26-04-06-login-resume-error-state-checkpoint.md |   20 +
 ...-auth-action-required-ready-panel-checkpoint.md |   23 +
 ...026-04-07-auth-continuation-retry-checkpoint.md |    5 +
 ...2026-04-07-auth-ready-next-action-checkpoint.md |   23 +
 ...026-04-07-auth-ready-panel-resume-checkpoint.md |   25 +
 ...04-07-auth-same-origin-connection-checkpoint.md |   18 +
 ...auth-action-required-modal-resume-checkpoint.md |   24 +
 ...-04-08-auth-action-required-smoke-checkpoint.md |   26 +
 ...-auth-basepath-connection-summary-checkpoint.md |   24 +
 ...26-04-08-auth-blocker-only-resume-checkpoint.md |   25 +
 ...-08-auth-bootstrap-password-shape-checkpoint.md |   24 +
 ...-08-auth-browser-smoke-resilience-checkpoint.md |   21 +
 ...uth-continuation-account-fallback-checkpoint.md |   23 +
 ...26-04-08-auth-continue-middleware-checkpoint.md |   30 +
 .../2026-04-08-auth-header-encoding-checkpoint.md  |   20 +
 ...h-keep-resumable-login-modal-open-checkpoint.md |   20 +
 ...-auth-scaffold-handoff-header-fix-checkpoint.md |   19 +
 ...6-04-09-auth-browser-ready-signal-checkpoint.md |   20 +
 .../2026-04-09-auth-connection-drift-checkpoint.md |   17 +
 ...uth-continuation-endpoint-preview-checkpoint.md |   19 +
 ...6-04-09-auth-draftsave-ui-handoff-checkpoint.md |   22 +
 ...26-04-09-auth-guard-browser-smoke-checkpoint.md |   17 +
 ...-09-auth-guard-handoff-visibility-checkpoint.md |   18 +
 ...04-09-auth-login-draftsave-submit-checkpoint.md |   17 +
 ...26-04-09-auth-login-panel-preview-checkpoint.md |   20 +
 ...-04-09-auth-login-payload-preview-checkpoint.md |   19 +
 ...6-04-09-auth-merge-blocker-status-checkpoint.md |   25 +
 ...09-auth-response-contract-preview-checkpoint.md |   30 +
 ...26-04-09-auth-resume-modal-reopen-checkpoint.md |   22 +
 notes/2026-04-09-auth-wiring-card-checkpoint.md    |   18 +
 ...th-action-connection-smoke-reload-checkpoint.md |   20 +
 ...-browser-override-smoke-stability-checkpoint.md |   22 +
 ...4-10-auth-no-log-ui-browser-smoke-checkpoint.md |   15 +
 ...-auth-override-continuation-smoke-checkpoint.md |   22 +
 ...nding-bootstrap-action-connection-checkpoint.md |   17 +
 ...persisted-continuation-connection-checkpoint.md |   18 +
 notes/2026-04-10-auth-vite-proxy-checkpoint.md     |   17 +
 package.json                                       |    8 +-
 scripts/auth-login-smoke.mjs                       | 1366 +++++++++++++
 scripts/gemini-review.sh                           |   69 +
 server/auth-persistent-store.js                    |  706 +++++++
 server/auth-persistent-store.test.js               |  209 ++
 src/components/ai-recommendation-state.js          |   43 +
 src/components/ai-recommendation-state.test.js     |  120 ++
 src/components/app-state.js                        |   23 +
 src/components/app-state.test.js                   |   91 +
 src/components/auth-backend-scaffold.js            |  805 ++++++++
 src/components/auth-backend-scaffold.test.js       | 1084 ++++++++++
 src/components/auth-bootstrap-state.js             |   16 +
 src/components/auth-bootstrap-state.test.js        |   38 +
 src/components/auth-config.js                      |  163 ++
 src/components/auth-config.test.js                 |  208 ++
 src/components/auth-flow-state.js                  |  421 ++++
 src/components/auth-flow-state.test.js             |  681 +++++++
 src/components/auth-intent-state.js                |   90 +
 src/components/auth-intent-state.test.js           |   73 +
 src/components/auth-session-merge.js               |   38 +
 src/components/auth-session-merge.test.js          |   48 +
 src/components/auth-session-restore.js             |   63 +
 src/components/auth-session-restore.test.js        |   56 +
 src/components/auth-session-view-state.js          |  506 +++++
 src/components/auth-session-view-state.test.js     |  857 ++++++++
 src/components/auth-storage.js                     |  518 +++++
 src/components/auth-storage.test.js                | 1186 +++++++++++
 src/components/auth-submit.js                      |  751 +++++++
 src/components/auth-submit.test.js                 | 1206 +++++++++++
 src/components/auth-wiring-state.js                |   77 +
 src/components/auth-wiring-state.test.js           |  215 ++
 src/components/bed-filter-state.js                 |   21 +
 src/components/bed-filter-state.test.js            |   59 +
 src/components/cart-state.js                       |   25 +
 src/components/cart-state.test.js                  |   57 +
 src/components/editor-state.js                     |   74 +
 src/components/editor-state.test.js                |   87 +
 src/components/layout-editor-command-handlers.js   |   19 +
 .../layout-editor-command-handlers.test.js         |   69 +
 src/components/layout-editor-command-runner.js     |   18 +
 .../layout-editor-command-runner.test.js           |   70 +
 src/components/layout-editor-view-state.js         |  145 ++
 src/components/layout-editor-view-state.test.js    |  250 +++
 src/components/layout-library-state.js             |   35 +
 src/components/layout-library-state.test.js        |   58 +
 src/components/login-guard.js                      |   35 +
 src/components/login-guard.test.js                 |   68 +
 src/components/navigation-state.js                 |   37 +
 src/components/navigation-state.test.js            |   34 +
 src/components/product-flow-state.js               |   16 +
 src/components/product-flow-state.test.js          |   37 +
 src/components/search-drawer.js                    |   33 +
 src/components/search-drawer.test.js               |   39 +
 src/components/space-profile-state.js              |   59 +
 src/components/space-profile-state.test.js         |  105 +
 src/components/space-profile.jsx                   |  123 ++
 src/components/space-summary.js                    |   22 +
 src/components/space-summary.test.js               |   40 +
 src/components/wishlist-state.js                   |    5 +
 src/components/wishlist-state.test.js              |   19 +
 src/main.jsx                                       | 2152 +++++++++++++++++---
 src/styles.css                                     |   49 +-
 vite.config.js                                     |  315 ++-
 176 files changed, 18369 insertions(+), 337 deletions(-)

## Gemini Output

### 1. Summary
This branch introduces a comprehensive authentication system alongside extensive state management modules for the application. It includes client-side auth flows, session handling, a persistent backend auth store (SQLite/JSON), massive updates to the application entry point (`main.jsx`), new Vite proxy configurations, and an extensive suite of unit and smoke tests.

### 2. What improved
*   **Structured State Management:** Extracted app state into dedicated modules (e.g., `auth-flow-state.js`, `cart-state.js`, `layout-editor-view-state.js`, `space-profile-state.js`), improving separation of concerns.
*   **Authentication Infrastructure:** Implemented complete auth scaffolding including backend persistence (`auth-persistent-store.js`), storage, session merge/restore, and submission handling.
*   **Testing Coverage:** Accompanied nearly every new state and component file with a corresponding unit test file (`*.test.js`), plus a robust E2E smoke test script (`auth-login-smoke.mjs`).
*   **Documentation:** Added thorough architectural checkpoint tracking via extensive `.md` notes.

### 3. Risks / regressions to check
*   **Monolithic Entry Point:** `src/main.jsx` grew by >2100 lines. This suggests excessive logic, routing, or inline components are living in the entry file, risking severe maintainability and rendering bottleneck issues.
*   **Missing Tracked Files:** `server/auth-http-server.js` and its tests are untracked. If the Vite proxy (`vite.config.js`) or client auth scaffolding depends on this server, the build/dev environment will fail for other developers if not committed.
*   **Vite Config Complexity:** The addition of 315 lines to `vite.config.js` suggests heavy proxying or custom middleware. This could introduce regressions in asset serving, HMR, or existing API routing.
*   **Database Files:** `.data/havenly-auth-store.*` (SQLite/JSON files) are untracked. Confirm that `.gitignore` properly ignores `.data/` to prevent committing local database state in future commits.

### 4. Small next checkpoint (smallest sensible next commit)
*   Stage and commit the missing `server/auth-http-server.js` and `server/auth-http-server.test.js` files to ensure backend consistency.
*   Refactor `src/main.jsx` by extracting providers, routing configurations, or top-level layout components into separate modules to break down the 2100+ line monolith. 

### 5. Test suggestions
*   Run the newly added `scripts/auth-login-smoke.mjs` to verify the end-to-end login flow against the new Vite proxy setup.
*   Execute the full unit test suite to validate the 30+ new `*.test.js` files.
*   Test the persistence layer: Log in, terminate the local dev server, restart, and confirm that `auth-session-restore.js` and `auth-persistent-store.js` correctly hydrate the session.
*   Verify the dev server starts without errors and that HMR remains functional given the significant Vite configuration changes.
