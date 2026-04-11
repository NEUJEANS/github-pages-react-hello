# Auth backend health checkpoint

- Added a lightweight `/api/auth/health` endpoint to the standalone auth HTTP server.
- The response confirms the sqlite-backed auth store path so local proxy/dev/smoke flows can wait for the real backend before driving the UI.
- Updated the proxy-backed auth smoke to explicitly wait for backend health before starting the frontend preview/browser scenarios.
- Added coverage for the new health endpoint.
- Re-checked the real proxy-backed browser auth flow after the change; the smoke still passes end to end.

No product UI logs/debug panels were added.
