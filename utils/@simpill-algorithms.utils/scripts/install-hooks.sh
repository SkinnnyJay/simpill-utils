#!/usr/bin/env bash
set -euo pipefail
# Install git hooks for algorithms.utils (optional; monorepo may have its own hooks).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || true
if [ -z "$GIT_ROOT" ]; then
  echo "[algorithms.utils] Not in a git repo. Skipping hooks."
  exit 0
fi
HOOK="$GIT_ROOT/.git/hooks/pre-push"
mkdir -p "$(dirname "$HOOK")"
if [ ! -f "$HOOK" ] || ! grep -q "algorithms.utils" "$HOOK" 2>/dev/null; then
  echo "[algorithms.utils] Add '$PACKAGE_DIR/scripts/check.sh' to pre-push hook if desired."
fi
exit 0
