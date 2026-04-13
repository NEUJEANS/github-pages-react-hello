# HAVENLY Parallel Branch Loop Workflow

## Why this setup
A separate full project copy would drift quickly and duplicate dependencies. The safer setup is:

- keep `havenly-live/` on stable `main`
- do active work in a dedicated branch
- use a **git worktree** so both can exist side-by-side
- preserve rollback points with a backup branch and safety tag

This gives parallel work without disturbing the current main checkout.

## Paths
- Stable checkout: `/home/user1_admin/.openclaw/workspace/havenly-live`
- Parallel worktree: `/home/user1_admin/.openclaw/workspace/havenly-live-parallel`

## Frozen rollback points created
From the current synced `main` state (`067ee4a`):

- Safety tag: `safety/havenly-main-2026-04-04_1526UTC`
- Backup branch: `backup/havenly-main-2026-04-04_1526UTC`
- Working branch: `havenly/parallel-loop-2026-04-04`
- Initial workflow checkpoint tag: `safety/havenly-parallel-setup-2026-04-04_1538UTC`

## Daily usage
### 1) Leave stable main alone
Use `havenly-live/` as the known-good reference checkout.

### 2) Do new work here
```bash
cd /home/user1_admin/.openclaw/workspace/havenly-live-parallel
```

### 3) Before each coding session
```bash
git fetch --all --prune
git status --short --branch
git log --oneline --decorate --graph -5
```

If `origin/main` moved and you want latest base:
```bash
git checkout main
# in the stable checkout only if needed
```
Then rebase the feature branch when ready:
```bash
cd /home/user1_admin/.openclaw/workspace/havenly-live-parallel
git fetch origin
git rebase origin/main
```

### 4) Work in small checkpoints
Aim for the smallest meaningful increments:
- one layout alignment fix
- one navigation behavior fix
- one animation refinement
- one accessibility pass
- one docs/update pass

Checkpoint rule:
- change one behavior cluster
- build/test
- get Gemini review
- commit with a clear message

### 5) Gemini feedback loop
Run after each small checkpoint or before committing a larger change:
```bash
cd /home/user1_admin/.openclaw/workspace/havenly-live-parallel
BASE_REF=origin/main ./scripts/gemini-review.sh
```

This writes a timestamped markdown review into `ai-reviews/`.
That directory is git-ignored by default so review artifacts stay local unless you intentionally add them.

Use Gemini output to decide:
- what risk to test manually
- whether to split work into a smaller commit
- what the next smallest checkpoint should be

### 6) Save a checkpoint commit
Example:
```bash
git add src/main.jsx src/styles.css
git commit -m "Refine top-nav search spacing and active state"
```

### 7) Optional: push remote checkpoint branch
```bash
git push -u origin havenly/parallel-loop-2026-04-04
```

## Recommended loop
1. Pick one micro-task from the checkpoint plan.
2. Implement only that slice.
3. Run local validation (`npm run build`, browser check, Playwright if needed).
4. Run Gemini review.
5. Fix anything obvious from Gemini.
6. Commit.
7. Repeat.

## Reverting safely
### Return working branch to the frozen starting point
```bash
git reset --hard safety/havenly-main-2026-04-04_1526UTC
```

### Compare current work against the original frozen point
```bash
git diff --stat safety/havenly-main-2026-04-04_1526UTC...HEAD
```

### Inspect backup branch
```bash
git log --oneline backup/havenly-main-2026-04-04_1526UTC -1
```

### Return to a previous checkpoint commit
```bash
git log --oneline --decorate -20
git reset --hard <checkpoint-commit>
```

### Create additional named safety points later
```bash
git tag safety/havenly-<topic>-$(date -u +%Y-%m-%d_%H%MUTC)
```

## Notes
- Do not develop in both checkouts on the same branch.
- Keep `main` clean in `havenly-live/`.
- Keep all iterative work in `havenly-live-parallel/` on `havenly/parallel-loop-2026-04-04`.
- Use small commits as rollback anchors.
