#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="zod.utils"

find_git_root() {
  local dir="$PACKAGE_DIR"
  while [ "$dir" != "/" ]; do
    if [ -d "$dir/.git" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

GIT_ROOT=$(find_git_root 2>/dev/null) || true
if [ -z "$GIT_ROOT" ]; then
  echo "[$PACKAGE_NAME] Not inside a git repository. Skipping hook installation."
  exit 0
fi
if [ "$GIT_ROOT" != "$PACKAGE_DIR" ]; then
  echo "[$PACKAGE_NAME] Monorepo detected. Skipping hook installation (manage at root)."
  exit 0
fi

HOOKS_DIR="$GIT_ROOT/.git/hooks"
mkdir -p "$HOOKS_DIR"

if [ "$GIT_ROOT" = "$PACKAGE_DIR" ]; then
  RELATIVE_PACKAGE_PATH="."
  IS_STANDALONE=true
else
  RELATIVE_PACKAGE_PATH="${PACKAGE_DIR#$GIT_ROOT}"
  RELATIVE_PACKAGE_PATH="${RELATIVE_PACKAGE_PATH#/}"
  IS_STANDALONE=false
fi
# In a monorepo, skip hook installation only when run via 'prepare' (root npm install)
# to avoid concurrent edits. Run 'npm run setup:hooks' in this package to install hooks.
if [ "$IS_STANDALONE" = false ] && [ "${npm_lifecycle_event:-}" = "prepare" ]; then
  echo "[$PACKAGE_NAME] Monorepo prepare: skipping hook installation (run 'npm run setup:hooks' in this package to install)."
  exit 0
fi


install_pre_commit_hook() {
  local PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"
  local MARKER_START="# --- BEGIN $PACKAGE_NAME ---"
  local MARKER_END="# --- END $PACKAGE_NAME ---"
  local PACKAGE_HOOK_CONTENT
  if [ "$IS_STANDALONE" = true ]; then
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if ! "\$REPO_ROOT/scripts/pre-commit.sh"; then exit 1; fi
$MARKER_END
EOF
)
  else
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if [ -f "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-commit.sh" ]; then
  if git diff --cached --name-only | grep -q "^$RELATIVE_PACKAGE_PATH/"; then
    if ! "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-commit.sh"; then exit 1; fi
  fi
fi
$MARKER_END
EOF
)
  fi
  if [ ! -f "$PRE_COMMIT_HOOK" ] || ! grep -q "Package Pre-Commit Hook" "$PRE_COMMIT_HOOK"; then
    printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' 'REPO_ROOT="$(git rev-parse --show-toplevel)"' \
      "$PACKAGE_HOOK_CONTENT" 'exit 0' > "$PRE_COMMIT_HOOK"
  fi
  chmod +x "$PRE_COMMIT_HOOK"
  echo "[$PACKAGE_NAME] ✓ Pre-commit hook installed"
}

install_pre_push_hook() {
  local PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"
  local MARKER_START="# --- BEGIN $PACKAGE_NAME ---"
  local MARKER_END="# --- END $PACKAGE_NAME ---"
  local PACKAGE_HOOK_CONTENT
  if [ "$IS_STANDALONE" = true ]; then
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if ! "\$REPO_ROOT/scripts/pre-push.sh"; then echo "[$PACKAGE_NAME] Pre-push failed!"; exit 1; fi
$MARKER_END
EOF
)
  else
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if [ -f "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh" ]; then
  if git diff --name-only HEAD @{push} 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/" || \
     git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/"; then
    if ! "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh"; then exit 1; fi
  fi
fi
$MARKER_END
EOF
)
  fi
  if [ ! -f "$PRE_PUSH_HOOK" ] || ! grep -q "Package Pre-Push Hook" "$PRE_PUSH_HOOK"; then
    printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' 'REPO_ROOT="$(git rev-parse --show-toplevel)"' \
      "$PACKAGE_HOOK_CONTENT" 'exit 0' > "$PRE_PUSH_HOOK"
  fi
  chmod +x "$PRE_PUSH_HOOK"
  echo "[$PACKAGE_NAME] ✓ Pre-push hook installed"
}

install_pre_commit_hook
install_pre_push_hook
echo "[$PACKAGE_NAME] Git hooks installed successfully!"
