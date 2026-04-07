
## 2026-04-07 auth continuation handoff
- Wired persisted login continuation (resumeToken/nextAction) back into the next login POST body + headers.
- Threaded continuation through main auth submit path and scaffold pending-handoff retention.
- Verified with npm test and npm run build; smoke script still needs a live local auth target.
