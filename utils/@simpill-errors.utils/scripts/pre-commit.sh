#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Pre-Commit Hook for @simpill/errors.utils
# =============================================================================
# Runs format and lint checks before allowing a commit.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="errors.utils"

cd "$PACKAGE_DIR"

echo ""
echo "[$PACKAGE_NAME] Running pre-commit checks..."
echo ""

FAILED=0

# Check formatting
echo "[1/2] Checking format..."
if npm run format:check > /dev/null 2>&1; then
  echo "✓ Format check passed."
else
  echo "✗ Format check FAILED!"
  echo "  Run 'npm run format' to fix formatting issues."
  FAILED=1
fi

# Run linter
echo "[2/2] Running linter..."
if npm run lint > /dev/null 2>&1; then
  echo "✓ Lint check passed."
else
  echo "✗ Lint check FAILED!"
  echo "  Run 'npm run lint:fix' to fix lint issues."
  FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "[$PACKAGE_NAME] ✓ Pre-commit checks passed."
  exit 0
else
  echo "[$PACKAGE_NAME] ✗ Pre-commit checks failed!"
  echo ""
  echo "Quick fix: npm run check:fix"
  exit 1
fi
