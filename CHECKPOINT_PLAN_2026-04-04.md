# HAVENLY Checkpoint Plan — 2026-04-04

Use this as the default commit slicing plan for the parallel branch.

## Checkpoint size rule
A checkpoint should usually fit one of these patterns:
- one visible UI fix
- one interaction behavior fix
- one responsive/layout fix
- one review-driven cleanup pass
- one docs/test helper update

If a change touches multiple concerns, split it.

## Suggested order
1. **Baseline sync + inspect**
   - fetch remote
   - compare against `origin/main`
   - note exact target slice before editing

2. **UI slice**
   - e.g. nav alignment, vertical rhythm, spacing, icon sizing
   - validate visually
   - build
   - Gemini review
   - commit

3. **Interaction slice**
   - e.g. search, drag, motion, click-state, transitions
   - validate directly in browser
   - Gemini review
   - commit

4. **Responsive slice**
   - desktop/tablet/mobile layout checks
   - validate edge breakpoints
   - Gemini review
   - commit

5. **Polish slice**
   - accessibility, cleanup, naming, dead CSS, consistency
   - Gemini review
   - commit

6. **Publish-ready slice**
   - final build
   - final Gemini review
   - push branch or merge when confident

## Commit message style
- `Refine <component/area> <specific change>`
- `Fix <behavior> in <state/context>`
- `Polish <screen/section> responsive layout`
- `Clean up <CSS/component> after Gemini review`

## Minimum validation before each commit
```bash
npm run build
```

If interaction changed, also do:
- direct browser check
- existing Playwright check if applicable

## Gemini loop trigger points
Run Gemini when:
- a slice is ready for commit
- a change feels bigger than expected
- you suspect regressions
- you want the next-smallest checkpoint suggestion
