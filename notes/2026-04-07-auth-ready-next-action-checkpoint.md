# 2026-04-07 auth ready next-action checkpoint

## What changed
- taught the authenticated login-ready panel to derive its primary CTA copy from backend `nextAction` values instead of always reusing the generic intent label
- added action-specific hints for `save-layout-draft`, `resume-layout-checkout`, `checkout-cart`, and `complete-profile` so the modal now reflects backend auth continuation requirements more clearly
- updated post-auth resume navigation to fall back to backend continuation actions when the serialized intent lacks a `returnScreen`, which keeps scaffold/frontend wiring realistic for backend-owned auth flows
- added focused unit coverage for both the continuation-to-screen fallback and the next-action-specific ready-panel state

## Validation
- `npm test` ✅
- `npm run build` ✅
- `npm run smoke:auth -- http://127.0.0.1:4174/github-pages-react-hello/` ✅
- Gemini review attempted via `bash scripts/gemini-review.sh`, but Gemini CLI hung again after loading cached credentials, so no fresh review markdown was produced this run

## Why this matters for auth wiring
- the frontend authenticated panel now behaves more like a thin shell over backend auth state instead of assuming the UI already knows the correct continuation step
- backend scaffolds can drive a realistic next-step UX (`checkout-cart`, layout resume, profile completion) even before the final auth backend exists
- missing `returnScreen` data is less likely to strand the user after bootstrap because the frontend can infer a safe continuation target from the backend contract

## Next smallest checkpoint
1. let the scaffold/session bootstrap preserve an explicit backend-owned CTA/status field for blockers like `complete-profile` or `verify-email`
2. add a tiny auth smoke/assertion for a bootstrapped `checkout-cart` or `resume-layout-checkout` ready-state payload so continuation fallback stays covered outside unit tests
3. keep narrowing the frontend auth panel down to serializable backend contract fields only, so swapping the scaffold for the real auth service stays mechanical
