# 2026-04-14 21:45 UTC — auth ready auto-resume + smoke feedback checkpoint

## Goal
Continue the HAVENLY auth/layout work in the main worktree with a coherent slice focused on post-login continuation behavior rather than scattered edits.

## Workflow / constraints followed
- Applied `github-sync-safety` first: verified local `main` matched `origin/main` before building on the current in-progress slice.
- Stayed page-first and auth-slice-first instead of reloading the whole app.
- Kept progress in files, not chat.
- Preserved `no-log-ui-defaults`: no user-facing debug/status panel additions inside the product UI.

## Slice validated and completed
This checkpoint finishes and validates the in-progress auth continuation slice already present in source:
- auto-resume ready auth modal paths for layout/account resumptions (`save-layout-draft`, `resume-layout-checkout`, `resume-guest-draft`, `resume-account-state`)
- avoid leaving the user stranded on a redundant ready panel after the backend has already advanced the continuation into a resumable state

## Feedback-loop fix added in the same coherent slice
The browser smoke harness was falsely accepting the stale pre-submit `프로필 보완 필요` session notice immediately after clicking the complete-profile submit CTA.

That made the smoke report a blocker even when the UI had already advanced.

Updated the complete-profile smoke wait step so post-submit success must *not* still contain the blocker notice:
- `scripts/auth-login-smoke.mjs`
  - complete-profile resumed wait now uses `forbiddenNoticeIncludes: ['프로필 보완 필요']`

This keeps the live feedback loop aligned to the real post-submit state instead of the stale pre-submit notice.

## Files in this checkpoint
### Existing in-progress source slice validated
- `src/components/auth-intent-state.js`
- `src/components/auth-intent-state.test.js`
- `src/main.jsx`

### New change in this checkpoint
- `scripts/auth-login-smoke.mjs`

## Validation
### Targeted tests
```bash
npm test -- --test-name-pattern='shouldAutoResumeReadyAuthModal|buildAuthResultSummary preserves the existing account label and session id when continuation responses omit them'
```
Result:
- 260 tests passed
- 0 failed

### Full auth/layout browser smoke through proxy-backed backend
```bash
npm run smoke:auth:proxy -- http://127.0.0.1:4180/github-pages-react-hello/
```
Result:
- passed
- covered:
  - signup
  - direct login
  - save-layout continuation
  - guarded merge flow
  - complete-profile continuation
  - verify-email continuation
  - proxy restart recovery
  - layout tray drag/drop persistence
  - auth target query/runtime overrides

### Key observed outputs from the passing smoke
- complete-profile resume status after submit:
  - `게스트 초안을 계정에 연결했어요. 복원됨: 배치 5개 · 추천 초안. 현재 단계: 프로필 준비 완료.`
- verify-email resume status after completion:
  - `게스트 초안을 계정에 연결했어요. 복원됨: 배치 5개 · 추천 초안. 현재 단계: 이메일 인증 완료.`
- save-layout continuation still resumes to `#layout`
- merge continuation still auto-opens checkout flow

## Why this checkpoint matters
Reliable live-feedback automation matters for the next auth/backend slices. Without this fix, the loop could misclassify a successful complete-profile continuation as still blocked and send follow-up work in the wrong direction.

## Next step
1. Build Pages artifacts.
2. Run secret scan.
3. Commit this coherent checkpoint on `main`.
4. Push to GitHub.
5. Test the deployed GitHub Pages site directly in browser.
6. Use that live result to choose the next auth/backend/layout slice.
