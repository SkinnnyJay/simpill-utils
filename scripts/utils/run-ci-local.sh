#!/usr/bin/env bash
# Run the same steps as GitHub Actions CI for each utils package.
# Usage: from repo root, ./scripts/utils/run-ci-local.sh
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
LOG_DIR="${REPO_ROOT}/.ci-run-logs"
mkdir -p "$LOG_DIR"
FAILED=()
for dir in utils/@simpill-*.utils; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  echo "========== CI: $name =========="
  if (cd "$dir" && npm run lint --silent 2>&1) >"$LOG_DIR/ci-lint.log" 2>&1; then
    echo "  lint OK"
  else
    echo "  lint FAIL"
    FAILED+=("$name (lint)")
    cat "$LOG_DIR/ci-lint.log" | tail -20
    continue
  fi
  if (cd "$dir" && npm run format:check --silent 2>&1) >"$LOG_DIR/ci-format.log" 2>&1; then
    echo "  format:check OK"
  else
    echo "  format:check FAIL"
    FAILED+=("$name (format:check)")
    cat "$LOG_DIR/ci-format.log" | tail -20
    continue
  fi
  if (cd "$dir" && npx tsc --noEmit 2>&1) >"$LOG_DIR/ci-tsc.log" 2>&1; then
    echo "  tsc OK"
  else
    echo "  tsc FAIL"
    FAILED+=("$name (tsc)")
    cat "$LOG_DIR/ci-tsc.log" | tail -20
    continue
  fi
  if (cd "$dir" && npm run test:coverage --silent 2>&1) >"$LOG_DIR/ci-test.log" 2>&1; then
    echo "  test:coverage OK"
  else
    echo "  test:coverage FAIL"
    FAILED+=("$name (test:coverage)")
    cat "$LOG_DIR/ci-test.log" | tail -30
    continue
  fi
  if (cd "$dir" && npm run build --silent 2>&1) >"$LOG_DIR/ci-build.log" 2>&1; then
    echo "  build OK"
  else
    echo "  build FAIL"
    FAILED+=("$name (build)")
    cat "$LOG_DIR/ci-build.log" | tail -20
  fi
done
echo ""
echo "============================================"
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "All packages passed CI locally."
  exit 0
fi
echo "FAILED: ${FAILED[*]}"
exit 1
