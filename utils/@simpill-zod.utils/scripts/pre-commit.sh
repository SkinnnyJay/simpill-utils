#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="zod.utils"

cd "$PACKAGE_DIR"

echo ""
echo "[$PACKAGE_NAME] Running pre-commit checks..."
echo ""

FAILED=0
echo "[1/2] Checking format..."
npm run format:check > /dev/null 2>&1 || { echo "✗ Format check FAILED! Run 'npm run format'"; FAILED=1; }
echo "[2/2] Running linter..."
npm run lint > /dev/null 2>&1 || { echo "✗ Lint FAILED! Run 'npm run lint:fix'"; FAILED=1; }

echo ""
if [ $FAILED -eq 0 ]; then
  echo "[$PACKAGE_NAME] ✓ Pre-commit checks passed."
  exit 0
else
  echo "[$PACKAGE_NAME] ✗ Pre-commit checks failed! npm run check:fix"
  exit 1
fi
