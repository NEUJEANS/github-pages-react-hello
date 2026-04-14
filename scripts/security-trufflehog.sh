#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOCAL_BIN="$ROOT_DIR/.bin/trufflehog"
WORKSPACE_BIN="/home/user1_admin/.openclaw/workspace/.bin/trufflehog"

if [[ -x "$LOCAL_BIN" ]]; then
  TRUFFLEHOG_BIN="$LOCAL_BIN"
elif [[ -x "$WORKSPACE_BIN" ]]; then
  TRUFFLEHOG_BIN="$WORKSPACE_BIN"
elif command -v trufflehog >/dev/null 2>&1; then
  TRUFFLEHOG_BIN="$(command -v trufflehog)"
else
  echo "trufflehog not found. Install it locally or place the binary at $WORKSPACE_BIN" >&2
  exit 127
fi

cd "$ROOT_DIR"
exec "$TRUFFLEHOG_BIN" git "file://$ROOT_DIR" --results=verified,unknown --fail "$@"
