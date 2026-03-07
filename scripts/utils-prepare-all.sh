#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Prepare all utils packages for npm: install, audit --fix, typecheck, test, build
# =============================================================================
# Run from repo root: ./scripts/utils-prepare-all.sh
# Exits 0 only if every package passes all steps.
# Fix any reported failures in the failing package, then re-run.
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UTILS_DIR="$REPO_ROOT/utils"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

FAILED_PACKAGES=()
TOTAL=0
PASSED=0

# Process in dependency order so typecheck/build can resolve file:../@simpill-*.utils
ORDERED_DIRS=()
while IFS= read -r line; do
  [ -n "$line" ] && ORDERED_DIRS+=("$UTILS_DIR/$line")
done < <(node "$SCRIPT_DIR/lib/publish-order.js" order "$REPO_ROOT" 2>/dev/null)
if [ ${#ORDERED_DIRS[@]} -eq 0 ]; then
  # Fallback: alphabetical
  for d in "$UTILS_DIR"/@simpill-*.utils; do
    [ -d "$d" ] && [ -f "$d/package.json" ] && ORDERED_DIRS+=("$d")
  done
fi

for d in "${ORDERED_DIRS[@]}"; do
  [ -d "$d" ] || continue
  [ -f "$d/package.json" ] || continue
  name=$(basename "$d")
  TOTAL=$((TOTAL + 1))
  echo "----------------------------------------"
  echo "  $name"
  echo "----------------------------------------"

  failed=false
  if ! (cd "$d" && npm install --no-audit --no-fund --silent 2>&1) >/dev/null; then
    echo "  install   ✗"
    failed=true
  else
    echo "  install   ✓"
  fi

  if [ "$failed" = false ]; then
    if (cd "$d" && npm audit fix --force 2>&1) >/dev/null; then
      echo "  audit     ✓"
    else
      echo "  audit     ⚠ (issues remain; run 'npm audit' in $d)"
      # Do not set failed=true: audit often exits 1 for unfixable issues; still run typecheck/test/build
    fi
  fi

  if [ "$failed" = false ]; then
    if ! (cd "$d" && npm run typecheck --if-present 2>&1) >/dev/null; then
      echo "  typecheck ✗"
      failed=true
    else
      echo "  typecheck ✓"
    fi
  fi

  if [ "$failed" = false ]; then
    if ! (cd "$d" && npm test --silent 2>&1) >/dev/null; then
      echo "  test     ✗"
      failed=true
    else
      echo "  test     ✓"
    fi
  fi

  if [ "$failed" = false ]; then
    if ! (cd "$d" && npm run build --silent 2>&1) >/dev/null; then
      echo "  build    ✗"
      failed=true
    else
      echo "  build    ✓"
    fi
  fi

  if [ "$failed" = true ]; then
    FAILED_PACKAGES+=("$name")
  else
    PASSED=$((PASSED + 1))
  fi
  echo ""
done

echo "============================================"
echo "Prepare all utils – summary"
echo "============================================"
echo "  Passed: $PASSED / $TOTAL"
if [ ${#FAILED_PACKAGES[@]} -gt 0 ]; then
  echo "  Failed:  ${FAILED_PACKAGES[*]}"
  echo ""
  echo "Fix issues in each package above, then re-run: ./scripts/utils-prepare-all.sh"
  echo "============================================"
  exit 1
fi
echo "  All packages ready for npm."
echo "============================================"
exit 0
