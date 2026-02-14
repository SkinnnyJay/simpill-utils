#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Verify All Utils – build and test every package under utils/*.utils
# =============================================================================
# Run from repo root: ./scripts/verify-all-utils.sh
# Exits 0 if all packages build and test pass; 1 otherwise.
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAILED_BUILD=()
FAILED_TEST=()

for d in utils/*.utils; do
  name=$(basename "$d")
  if (cd "$d" && npm run build --silent 2>&1) >/dev/null; then
    echo "  build $name ✓"
  else
    echo "  build $name ✗"
    FAILED_BUILD+=("$name")
  fi
  if (cd "$d" && npm test --silent 2>&1) >/dev/null; then
    echo "  test  $name ✓"
  else
    echo "  test  $name ✗"
    FAILED_TEST+=("$name")
  fi
done

echo ""
echo "============================================"
echo "Verify all utils – summary"
echo "============================================"
if [ ${#FAILED_BUILD[@]} -eq 0 ] && [ ${#FAILED_TEST[@]} -eq 0 ]; then
  echo "All packages: build and test passed."
  echo "============================================"
  exit 0
fi
[ ${#FAILED_BUILD[@]} -gt 0 ] && echo "Build failed: ${FAILED_BUILD[*]}"
[ ${#FAILED_TEST[@]} -gt 0 ] && echo "Test failed:  ${FAILED_TEST[*]}"
echo "============================================"
exit 1
