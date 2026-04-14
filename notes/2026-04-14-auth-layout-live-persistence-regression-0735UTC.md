# HAVENLY live verification — apartment selection persistence still regresses after authenticated save/reload

- Time: 2026-04-14 07:35 UTC
- Deploy tested: `main` @ `920bc3f` (`fix: persist apartment selection in auth layout saves`)
- URL: `https://neujeans.github.io/github-pages-react-hello/#layout`
- Verification method: local Playwright against live GitHub Pages (browser-control server unavailable)

## Deploy readiness

Confirmed live `index.html` now serves the new asset:
- `index-DpyZtUIj.js`

## What was tested

### Flow A — context drift only
1. Opened live layout page
2. Logged in with `board@example.com` / `password123`
3. Confirmed baseline account-board panel showed:
   - saved context: `래미안 포레스트 84A`
   - current context: `84A · 3개 공간 선택`
4. Opened the space-info overlay
5. Switched apartment to `아크로 리버뷰 101A`
6. Returned to editor

### Result A
The current-context line changed to `101A · 3개 공간 선택`, but the saved-context line remained `래미안 포레스트 84A`.

That is expected before saving, but it also exposed a product nuance:
- the explicit `계정 저장본 불러오기` button is disabled for pure context drift, because drift detection currently keys off layout/tray/recommendation changes rather than saved/current context mismatch.

## Stronger persistence test

### Flow B — save under a different apartment, then reload while still authenticated
1. Starting from logged-in state, changed apartment to `아크로 리버뷰 101A`
2. Clicked `현재 보드 다시 저장`
3. Saw success copy: `현재 배치를 계정 저장본으로 업데이트했어요.`
4. Reloaded the live page while keeping the authenticated session
5. Re-read the account-board panel and re-opened the space-info overlay

### Result B
After reload, the app returned to:
- saved context line: `래미안 포레스트 84A`
- current context line: `84A · 3개 공간 선택`
- selected apartment button in overlay: `래미안 포레스트 84A`

So the live end-to-end behavior still **does not persist/re-hydrate the changed apartment selection** through authenticated save → reload.

## Interpretation

The local code/tests/build were green, but live verification shows the user-visible persistence path is still incomplete.

Likely implications:
- the new `apartmentSelectionId` field is not making it all the way through the specific live save path that later hydrates the authenticated session, **or**
- it is being written somewhere but the hydrated session / account-state summary / restore patch still prefers older context during bootstrapping.

Because the page returned to `84A` after an authenticated reload, this is a real persistence bug, not just a display-copy mismatch.

## Best next slice

Stay in the same auth/layout slice and inspect only the save + rehydrate chain for:
1. `save-layout-draft` continuation request payload on live path
2. normalization into persisted account state / session payload
3. authenticated bootstrap/session restore patch after reload
4. any place where `draftSave.apartmentSelectionId` is dropped or overridden by older account summary data

## Important note for future work

The logout + fresh-login flow is noisier because guest/account merge semantics can mask the persisted account state. The cleaner live verification for this slice is:
- save under a different apartment while authenticated
- reload without logging out
- verify whether the authenticated session restore reapplies the changed apartment selection
