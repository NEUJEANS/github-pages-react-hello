# HAVENLY auth/login field binding checkpoint — 2026-04-14 17:10 UTC

## Why this slice
After the selected-space drift fix reached GitHub Pages, live Playwright feedback on the real deployed board-save flow exposed a concrete auth UX gap:

- the guarded board-save/login modal rendered correctly
- but the visible `이메일` / `비밀번호` labels were not actually bound to the underlying inputs
- browser automation could see the modal and sometimes the fields visually, but stable role/name targeting for the live auth flow was unreliable

This is not a cosmetic-only issue. It affects:
- auth accessibility
- browser/automation stability for the real Pages login flow
- confidence when validating layout save/restore on the deployed site

## Coherent files touched
- `src/main.jsx`
- generated Pages artifacts via `npm run build:pages`
  - `docs/index.html`
  - `docs/assets/*`
  - local `dist/*`

## What changed
Updated the login/signup form inputs inside the auth modal so they now expose real field semantics instead of relying on adjacent text only.

### Added explicit label/input binding
- `label htmlFor="auth-display-name"`
- `label htmlFor="auth-email"`
- `label htmlFor="auth-password"`
- `label htmlFor="auth-confirm-password"`

### Added stable input ids / names / accessibility metadata
- display name
  - `id="auth-display-name"`
  - `name="displayName"`
  - `autoComplete="name"`
  - `aria-label="이름"`
- email
  - `id="auth-email"`
  - `name="email"`
  - `type="email"`
  - `autoComplete="email"`
  - `inputMode="email"`
  - `aria-label="이메일"`
- password
  - `id="auth-password"`
  - `name="password"`
  - `type="password"`
  - `autoComplete="current-password"` in login mode
  - `autoComplete="new-password"` in signup mode
  - `aria-label="비밀번호"`
- confirm password
  - `id="auth-confirm-password"`
  - `name="confirmPassword"`
  - `type="password"`
  - `autoComplete="new-password"`
  - `aria-label="비밀번호 확인"`

## Validation
### Focused tests
Ran:
```bash
npm test -- --test-name-pattern='auth|layoutAuthPanelState|save-layout'
```

Result:
- 257 tests passed
- 0 failed

### Pages build
Ran:
```bash
npm run build:pages
```

Result:
- build passed
- docs sync completed
- new bundle observed locally:
  - `docs/assets/index-DZcJs6br.js`
  - `docs/assets/main-BFqRNzs3.js`

## Live feedback captured before this patch
- the deployed board-save guarded login flow reached the correct modal state
- screenshots showed the auth modal with visible `이메일` and `비밀번호` labels
- the underlying input semantics were not strong enough for reliable role/name targeting during live validation

## Next step
- run `npm run security:secrets`
- commit/push this auth-form binding slice
- wait for Pages to publish the new bundle
- re-run live auth/layout validation against the deployed site with the fresh public auth tunnel:
  - verify the guarded login modal fields are targetable by label/name
  - recheck the board-save → apartment switch → restore path on live Pages

## No-log-ui check
- no debug/progress UI added to the product
- changes stay inside auth form semantics only
