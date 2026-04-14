# HAVENLY live verification — saved/current board context

- Time: 2026-04-14 06:50 UTC
- Deploy tested: `main` @ `6ad1ed5` (`fix: separate saved vs current layout board context`)
- URL: `https://neujeans.github.io/github-pages-react-hello/#layout`
- Verification method: local Playwright against the live GitHub Pages site (browser-control server was unavailable)

## Deploy readiness

Confirmed the live `index.html` switched to the expected JS asset:

- expected asset: `index-ZH667VzJ.js`
- matched on live after the push

## Live smoke flow

1. Opened live layout page
2. Logged in with `board@example.com`
3. Read the account-board panel text
4. Opened the space-info overlay
5. Switched the selected apartment from the default to `아크로 리버뷰 101A`
6. Returned to the editor
7. Read the account-board panel text again

## Live result

### After login

`계정 보드 저장본 배치 5개 · 트레이 3개 현재 보드 배치 5개 · 트레이 3개 저장 기준 · 거실 · 래미안 포레스트 84A 현재 기준 · 거실 · 84A · 3개 공간 선택 현재 보드가 계정 저장본과 같아요.`

### After apartment drift

`계정 보드 저장본 배치 5개 · 트레이 3개 현재 보드 배치 5개 · 트레이 3개 저장 기준 · 거실 · 래미안 포레스트 84A 현재 기준 · 거실 · 101A · 3개 공간 선택 현재 보드가 계정 저장본과 같아요.`

## Interpretation

The production site now clearly distinguishes:

- the persisted **saved board context**
- the **current page context** after the user changes apartment context locally

That confirms the slice fixed the misleading summary issue in the live GitHub Pages build.

## Follow-up candidate for next slice

The next auth/layout checkpoint should probably focus on one of these backend-adjacent improvements:

1. persist and surface a richer saved-board metadata line (for example explicit saved-at/account-board timestamp copy in the panel)
2. tighten the copy around “board matches saved account state” so context drift does not imply full board equivalence when only metadata differs
3. verify whether restoring a saved board should also reapply saved apartment/space context or intentionally keep that local context separate

I would prioritize #2 or #3 next, because the current live text says the board matches the saved account state even when the saved/current context labels differ. That may be acceptable if "match" refers only to board contents, but it is worth deciding explicitly.
