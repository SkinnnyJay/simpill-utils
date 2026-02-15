#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Git Hooks Installation Script for @simpill/object.utils
# =============================================================================
# This script installs git hooks for the package's git repository.
# It works whether the package is standalone or part of a monorepo.
#
# Hooks installed:
#   - pre-commit: Format and lint checks
#   - pre-push: Full verification (format, lint, typecheck, test, build)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="object.utils"

# Find the git root (could be the monorepo root or package root)
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
  echo "[$PACKAGE_NAME] Run 'git init' at the repository root to enable git hooks."
  exit 0
fi

HOOKS_DIR="$GIT_ROOT/.git/hooks"

echo "[$PACKAGE_NAME] Installing git hooks..."
echo "[$PACKAGE_NAME] Git root: $GIT_ROOT"

mkdir -p "$HOOKS_DIR"

# Calculate relative path from git root to this package
if [ "$GIT_ROOT" = "$PACKAGE_DIR" ]; then
  RELATIVE_PACKAGE_PATH="."
  IS_STANDALONE=true
else
  RELATIVE_PACKAGE_PATH="${PACKAGE_DIR#$GIT_ROOT}"
  RELATIVE_PACKAGE_PATH="${RELATIVE_PACKAGE_PATH#/}"
  IS_STANDALONE=false
fi

# =============================================================================
# Install Pre-Commit Hook
# =============================================================================
install_pre_commit_hook() {
  local PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"
  local MARKER_START="# --- BEGIN $PACKAGE_NAME ---"
  local MARKER_END="# --- END $PACKAGE_NAME ---"

  # Create the hook content for this package
  local PACKAGE_HOOK_CONTENT
  if [ "$IS_STANDALONE" = true ]; then
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if ! "\$REPO_ROOT/scripts/pre-commit.sh"; then
  exit 1
fi
$MARKER_END
EOF
)
  else
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if [ -f "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-commit.sh" ]; then
  if git diff --cached --name-only | grep -q "^$RELATIVE_PACKAGE_PATH/"; then
    if ! "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-commit.sh"; then
      exit 1
    fi
  fi
fi
$MARKER_END
EOF
)
  fi

  # Check if hook exists and has our header
  if [ -f "$PRE_COMMIT_HOOK" ]; then
    if grep -q "# Package Pre-Commit Hook" "$PRE_COMMIT_HOOK"; then
      # Remove existing entry for this package if present
      if grep -q "$MARKER_START" "$PRE_COMMIT_HOOK"; then
        awk "/$MARKER_START/,/$MARKER_END/{next}1" "$PRE_COMMIT_HOOK" > "$PRE_COMMIT_HOOK.tmp"
        [ -f "$PRE_COMMIT_HOOK.tmp" ] && mv "$PRE_COMMIT_HOOK.tmp" "$PRE_COMMIT_HOOK"
      fi
      
      # Remove trailing exit and add our content
      if grep -q "^exit 0$" "$PRE_COMMIT_HOOK"; then
        sed -i.bak '/^exit 0$/d' "$PRE_COMMIT_HOOK" && rm -f "$PRE_COMMIT_HOOK.bak"
      fi
      
      echo "" >> "$PRE_COMMIT_HOOK"
      echo "$PACKAGE_HOOK_CONTENT" >> "$PRE_COMMIT_HOOK"
      echo "" >> "$PRE_COMMIT_HOOK"
      echo "exit 0" >> "$PRE_COMMIT_HOOK"
    else
      # Hook exists but isn't ours - back it up
      echo "[$PACKAGE_NAME] Existing pre-commit hook found. Backing up to pre-commit.backup"
      mv "$PRE_COMMIT_HOOK" "$PRE_COMMIT_HOOK.backup"
    fi
  fi

  # Create new hook if needed
  if [ ! -f "$PRE_COMMIT_HOOK" ] || ! grep -q "# Package Pre-Commit Hook" "$PRE_COMMIT_HOOK"; then
    cat > "$PRE_COMMIT_HOOK" << 'HOOK_HEADER'
#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Package Pre-Commit Hook
# =============================================================================
# Runs format and lint checks before allowing a commit.
# =============================================================================

REPO_ROOT="$(git rev-parse --show-toplevel)"

HOOK_HEADER

    echo "" >> "$PRE_COMMIT_HOOK"
    echo "$PACKAGE_HOOK_CONTENT" >> "$PRE_COMMIT_HOOK"
    echo "" >> "$PRE_COMMIT_HOOK"
    echo "exit 0" >> "$PRE_COMMIT_HOOK"
  fi

  chmod +x "$PRE_COMMIT_HOOK"
  echo "[$PACKAGE_NAME] ✓ Pre-commit hook installed"
}

# =============================================================================
# Install Pre-Push Hook
# =============================================================================
install_pre_push_hook() {
  local PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"
  local MARKER_START="# --- BEGIN $PACKAGE_NAME ---"
  local MARKER_END="# --- END $PACKAGE_NAME ---"

  # Create the hook content for this package
  local PACKAGE_HOOK_CONTENT
  if [ "$IS_STANDALONE" = true ]; then
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
echo ""
echo "=========================================="
echo "Running pre-push checks for $PACKAGE_NAME"
echo "=========================================="
if ! "\$REPO_ROOT/scripts/pre-push.sh"; then
  echo "[$PACKAGE_NAME] Pre-push checks failed!"
  exit 1
fi
$MARKER_END
EOF
)
  else
    PACKAGE_HOOK_CONTENT=$(cat << EOF
$MARKER_START
if [ -f "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh" ]; then
  if git diff --name-only HEAD @{push} 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/" || \
     git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "^$RELATIVE_PACKAGE_PATH/"; then
    echo ""
    echo "=========================================="
    echo "Running pre-push checks for $PACKAGE_NAME"
    echo "=========================================="
    if ! "\$REPO_ROOT/$RELATIVE_PACKAGE_PATH/scripts/pre-push.sh"; then
      echo "[$PACKAGE_NAME] Pre-push checks failed!"
      exit 1
    fi
  else
    echo "[$PACKAGE_NAME] No changes detected, skipping checks."
  fi
fi
$MARKER_END
EOF
)
  fi

  # Check if hook exists and has our header
  if [ -f "$PRE_PUSH_HOOK" ]; then
    if grep -q "# Package Pre-Push Hook" "$PRE_PUSH_HOOK"; then
      # Remove existing entry for this package if present
      if grep -q "$MARKER_START" "$PRE_PUSH_HOOK"; then
        awk "/$MARKER_START/,/$MARKER_END/{next}1" "$PRE_PUSH_HOOK" > "$PRE_PUSH_HOOK.tmp"
        [ -f "$PRE_PUSH_HOOK.tmp" ] && mv "$PRE_PUSH_HOOK.tmp" "$PRE_PUSH_HOOK"
      fi
      
      # Remove trailing exit and add our content
      if grep -q "^exit 0$" "$PRE_PUSH_HOOK"; then
        sed -i.bak '/^exit 0$/d' "$PRE_PUSH_HOOK" && rm -f "$PRE_PUSH_HOOK.bak"
      fi
      
      echo "" >> "$PRE_PUSH_HOOK"
      echo "$PACKAGE_HOOK_CONTENT" >> "$PRE_PUSH_HOOK"
      echo "" >> "$PRE_PUSH_HOOK"
      echo "exit 0" >> "$PRE_PUSH_HOOK"
    else
      # Hook exists but isn't ours - back it up
      echo "[$PACKAGE_NAME] Existing pre-push hook found. Backing up to pre-push.backup"
      mv "$PRE_PUSH_HOOK" "$PRE_PUSH_HOOK.backup"
    fi
  fi

  # Create new hook if needed
  if [ ! -f "$PRE_PUSH_HOOK" ] || ! grep -q "# Package Pre-Push Hook" "$PRE_PUSH_HOOK"; then
    cat > "$PRE_PUSH_HOOK" << 'HOOK_HEADER'
#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Package Pre-Push Hook
# =============================================================================
# Runs full verification before allowing a push.
# =============================================================================

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "Running pre-push checks..."

HOOK_HEADER

    echo "" >> "$PRE_PUSH_HOOK"
    echo "$PACKAGE_HOOK_CONTENT" >> "$PRE_PUSH_HOOK"
    echo "" >> "$PRE_PUSH_HOOK"
    echo "exit 0" >> "$PRE_PUSH_HOOK"
  fi

  chmod +x "$PRE_PUSH_HOOK"
  echo "[$PACKAGE_NAME] ✓ Pre-push hook installed"
}

# =============================================================================
# Main
# =============================================================================
install_pre_commit_hook
install_pre_push_hook

echo ""
echo "[$PACKAGE_NAME] Git hooks installed successfully!"
echo ""
echo "Hooks active:"
echo "  pre-commit: Format + Lint checks"
echo "  pre-push:   Format + Lint + Type check + Tests + Build"
echo ""
echo "To skip hooks temporarily: git commit --no-verify / git push --no-verify"
