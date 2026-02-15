#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PACKAGE_DIR"
FAILED=0
run_check() { if eval "$2"; then echo "✓ $1"; else echo "✗ $1 FAILED"; FAILED=1; fi; }
run_check "Format" "npm run format:check"
run_check "Lint" "npm run lint"
run_check "Typecheck" "npx tsc --noEmit"
run_check "Tests" "npm test"
run_check "Build" "npm run build"
[ $FAILED -eq 0 ] && exit 0 || exit 1
