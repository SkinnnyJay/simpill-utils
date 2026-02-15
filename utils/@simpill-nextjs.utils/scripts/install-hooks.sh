#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="nextjs.utils"
find_git_root() {
  local dir="$PACKAGE_DIR"
  while [ "$dir" != "/" ]; do
    if [ -d "$dir/.git" ]; then echo "$dir"; return 0; fi
    dir="$(dirname "$dir")"
  done
  return 1
}
GIT_ROOT=$(find_git_root 2>/dev/null) || true
[ -z "$GIT_ROOT" ] && echo "[$PACKAGE_NAME] Not in git. Skipping hooks." && exit 0
HOOKS_DIR="$GIT_ROOT/.git/hooks"
mkdir -p "$HOOKS_DIR"
if [ "$GIT_ROOT" = "$PACKAGE_DIR" ]; then
  RELATIVE_PACKAGE_PATH="."
else
  RELATIVE_PACKAGE_PATH="${PACKAGE_DIR#$GIT_ROOT}"
  RELATIVE_PACKAGE_PATH="${RELATIVE_PACKAGE_PATH#/}"
fi
PRE_PUSH="$HOOKS_DIR/pre-push"
cat > "$PRE_PUSH" << HOOKEOF
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="\$(git rev-parse --show-toplevel)"
if [ -f "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh" ]; then
  if git diff --name-only HEAD @{push} 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/" || git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/"; then
    "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh"
  fi
fi
HOOKEOF
chmod +x "$PRE_PUSH"
echo "[$PACKAGE_NAME] Pre-push hook installed."
