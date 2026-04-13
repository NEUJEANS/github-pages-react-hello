#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REVIEW_DIR="$ROOT_DIR/ai-reviews"
mkdir -p "$REVIEW_DIR"

STAMP="$(date -u +%Y-%m-%d_%H%MUTC)"
OUT_FILE="${1:-$REVIEW_DIR/gemini-review-${STAMP}.md}"
BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"
BASE_REF="${BASE_REF:-origin/main}"

DIFFSTAT="$(git -C "$ROOT_DIR" diff --stat "${BASE_REF}" || true)"
CHANGED_FILES="$(git -C "$ROOT_DIR" diff --name-only "${BASE_REF}" || true)"
UNTRACKED_FILES="$(git -C "$ROOT_DIR" ls-files --others --exclude-standard || true)"

PROMPT=$(cat <<EOF
You are reviewing a React/Vite project branch for safe incremental progress.

Repository: HAVENLY React project
Current branch: ${BRANCH}
Comparison base: ${BASE_REF}
Changed tracked files:
${CHANGED_FILES}

Untracked files pending add/commit:
${UNTRACKED_FILES}

Diffstat:
${DIFFSTAT}

Produce concise markdown with these sections:
1. Summary
2. What improved
3. Risks / regressions to check
4. Small next checkpoint (smallest sensible next commit)
5. Test suggestions

Review only from the changed file list, untracked file list, and diffstat provided above. Be concrete. Prefer actionable feedback over praise.
EOF
)

{
  echo "# Gemini Review"
  echo
  echo "- Generated: $(date -u)"
  echo "- Branch: ${BRANCH}"
  echo "- Base: ${BASE_REF}"
  echo
  git -C "$ROOT_DIR" status --short --branch
  echo
  echo "## Changed files"
  echo
  printf '%s\n' "$CHANGED_FILES"
  echo
  echo "## Untracked files"
  echo
  printf '%s\n' "$UNTRACKED_FILES"
  echo
  echo "## Diffstat"
  echo
  printf '%s\n' "$DIFFSTAT"
  echo
  echo "## Gemini Output"
  echo
  gemini --approval-mode plan --output-format text -p "$PROMPT"
} > "$OUT_FILE"

echo "$OUT_FILE"
