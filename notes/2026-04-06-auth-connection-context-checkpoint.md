# HAVENLY parallel checkpoint — 2026-04-06 auth connection context slice

## What changed
- Persisted a serializable auth connection snapshot alongside both the pending login handoff and the successful auth session.
- The saved payload now keeps the request method, endpoint, resolved URL, target label, credential mode, source, and same-origin/external flags.
- Wired the current login flow so `handleLoginSubmit()` stores that connection metadata when it writes the auth handoff/session records.
- Extended the post-login session notice so the frontend now tells us which auth target/endpoint the login used, which is useful while the backend auth route is still scaffolded and being wired up.

## Verification
- `npm test` ✅
- `npm run build` ✅
- `BASE_REF=origin/havenly/parallel-loop-2026-04-04 npm run review:gemini` ✅ output captured in `ai-reviews/gemini-review-2026-04-06_1632UTC.md`

## Why this matters for auth priority
- The guarded login flow already preserved guest draft + intent handoff data; this adds the backend connection side of the contract so resume/debug flows now keep *where* auth was supposed to go, not just *what* was being submitted.
- It makes the frontend/backend auth scaffold easier to inspect while moving toward a real backend login route, especially when switching between same-origin scaffold and configured external auth targets.
- It stays small and reversible: no broad refactor, just tighter login-path state persistence.

## Small next steps
1. Surface the persisted connection info in the resume-ready login state so interrupted login attempts clearly show the previous auth target before retry.
2. Add one focused test for a configured external auth base URL through the browser smoke once Playwright is runnable in this workspace.
3. If the backend contract stabilizes, start persisting a backend-issued `nextAction`/`resumeToken` field next to the existing frontend intent.
