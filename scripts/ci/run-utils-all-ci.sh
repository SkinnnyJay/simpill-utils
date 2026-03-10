#!/usr/bin/env bash
# Run full CI (install, build deps, lint, format, typecheck, test:coverage, build) for every utils package.
# Usage: from repo root, bash scripts/ci/run-utils-all-ci.sh
# Used by .github/workflows/utils-all-ci.yml (single job).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
FAILED=()
for dir in utils/@simpill-*.utils; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  echo "========== CI: $name =========="
  if ! (cd "$dir" && npm ci --silent 2>&1); then
    echo "  npm ci FAIL"
    FAILED+=("$name (npm ci)")
    continue
  fi
  echo "  npm ci OK"
  if ! node scripts/ci/build-package-deps.js "$dir" 2>&1; then
    echo "  build deps FAIL"
    FAILED+=("$name (build deps)")
    continue
  fi
  echo "  build deps OK"
  if ! (cd "$dir" && npm run lint --silent 2>&1); then
    echo "  lint FAIL"
    FAILED+=("$name (lint)")
    continue
  fi
  echo "  lint OK"
  if ! (cd "$dir" && npm run format:check --silent 2>&1); then
    echo "  format:check FAIL"
    FAILED+=("$name (format:check)")
    continue
  fi
  echo "  format:check OK"
  if ! (cd "$dir" && npx tsc --noEmit 2>&1); then
    echo "  tsc FAIL"
    FAILED+=("$name (tsc)")
    continue
  fi
  echo "  tsc OK"
  if ! (cd "$dir" && npm run test:coverage --silent 2>&1); then
    echo "  test:coverage FAIL"
    FAILED+=("$name (test:coverage)")
    continue
  fi
  echo "  test:coverage OK"
  if ! (cd "$dir" && npm run build --silent 2>&1); then
    echo "  build FAIL"
    FAILED+=("$name (build)")
    continue
  fi
  echo "  build OK"
done
echo ""
echo "============================================"
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "All packages passed CI."
  exit 0
fi
echo "FAILED: ${FAILED[*]}"
exit 1
