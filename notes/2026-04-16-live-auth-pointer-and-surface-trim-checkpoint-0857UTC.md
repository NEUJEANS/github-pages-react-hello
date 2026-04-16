# HAVENLY live auth pointer + surface trim checkpoint — 2026-04-16 08:57 UTC

## Required decision step
1. Restated requirement: get bare live login/signup working again, then keep only the viable layout/auth product surface.
2. Smallest candidate next actions:
   - revive the dead public auth backend pointer
   - validate that the public backend really accepts GitHub Pages-origin signup/session traffic
   - trim the removed apartment exploration/search/browsing UI without disturbing layout/auth
3. Chosen action: restore a fresh public auth tunnel first, validate it directly, then trim the non-viable surfaces and rebuild Pages assets.

## Direct progress made
- Confirmed the previously deployed live auth backend URL was dead (`503 no tunnel here :(`).
- Verified the local sqlite auth backend on `http://127.0.0.1:4175/api/auth/health` was still healthy.
- Opened a fresh localhost.run public auth tunnel:
  - session: `keen-haven`
  - public auth base URL: `https://787ea7d4813eeb.lhr.life`
- Verified the fresh public backend before repointing:
  - `GET /api/auth/health` ✅
  - `OPTIONS /api/auth/signup` from `Origin: https://neujeans.github.io` ✅
- Ran a real public auth round-trip through the fresh tunnel from the GitHub Pages origin:
  - `POST /api/auth/signup` ✅ (`200`, `SameSite=None; Secure` cookies set)
  - `GET /api/auth/session` with returned cookie ✅
- Repointed runtime auth config to the fresh verified tunnel:
  - `public/havenly-auth-config.js`
  - `docs/havenly-auth-config.js`
- Trimmed frontend surfaces that were judged non-viable:
  - replaced recommendation/onboarding screens with a simple “focus shifted to layout/auth” surface
  - replaced catalog/browsing screens with the same simplified residual surface
  - removed layout-editor action buttons that navigated back into browsing/recommendation flows
  - simplified the layout editor’s top header copy so it no longer foregrounds apartment exploration/search
- Fixed build blockers in the checked-out refactor state:
  - removed duplicated corrupted tail content from `src/app-shell.jsx`
  - corrected bad import path `./components/spa-hash-spa-hash-navigation-state.js` → `./components/spa-hash-navigation-state.js`
- Rebuilt and resynced Pages assets with `npm run build:pages` ✅

## What I tested
- `curl --max-time 5 -i http://127.0.0.1:4175/api/auth/health` ✅
- `curl -i https://787ea7d4813eeb.lhr.life/api/auth/health` ✅
- `curl -i -X OPTIONS https://787ea7d4813eeb.lhr.life/api/auth/signup -H 'Origin: https://neujeans.github.io' ...` ✅
- Real signup/session round-trip through the public tunnel with GitHub Pages origin + cookie jar ✅
- `npm run build:pages` ✅

## Current blocker
- Bare live URL success is not complete yet because these repo changes have not been secret-scanned, committed, pushed, and allowed to propagate on GitHub Pages.
- The public tunnel is still a fragile temporary dependency and can expire again before/after deploy.

## Next direct step
1. Run `npm run security:secrets`.
2. If clean, commit the runtime pointer refresh + surface trim/build fixes.
3. Push to `main`.
4. Re-check the bare live runtime file on `https://neujeans.github.io/github-pages-react-hello/havenly-auth-config.js` and then test bare live login/signup on `https://neujeans.github.io/github-pages-react-hello/#layout` before the tunnel expires.
