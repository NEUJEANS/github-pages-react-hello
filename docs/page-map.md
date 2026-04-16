# HAVENLY Page Map

Use this file first before reading app code.

## Page 1 — Auth / Entry
- Scope: login, signup, auth modal, session entry, profile completion entry
- Primary goal now: make bare live login/signup buttons actually work
- Read first when task mentions: 로그인, 회원가입, auth, 세션, complete-profile, 버튼 동작
- Likely files:
  - `src/main.jsx` (thin orchestration only, during refactor)
  - auth page module after split
  - auth-related components/hooks/tests

## Page 2 — Layout / Editor
- Scope: layout editor, save/restore, board state, authenticated layout continuity
- Read first when task mentions: layout, 저장, 불러오기, board, editor
- Likely files:
  - layout page module after split
  - layout/auth-panel related components/hooks/tests

## Page 3 — Review / Result / Remaining product surface
- Scope: any non-auth, non-layout residual product page after the split
- Read first when task mentions: final flow, summary page, result page, residual UI organization
- Likely files:
  - third page module after split

## Rules
- Do not start by loading the whole app.
- Pick the page first.
- Read the corresponding page summary doc before code.
- Only then inspect the smallest relevant files.
