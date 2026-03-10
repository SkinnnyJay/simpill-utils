#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="algorithms.utils"
cd "$PACKAGE_DIR"
echo "" && echo "============================================" && echo "Running pre-push checks for $PACKAGE_NAME" && echo "============================================" && echo ""
FAILED=0
run_check() { local step_num="$1" step_name="$2" command="$3"; echo "[$step_num/5] $step_name..."; if eval "$command"; then echo "✓ $step_name passed."; echo ""; else echo "✗ $step_name FAILED!"; echo ""; FAILED=1; return 1; fi; }
run_check "1" "Checking format" "npm run format:check" || true
run_check "2" "Running linter" "npm run lint" || true
run_check "3" "Running type check" "npx tsc --noEmit" || true
run_check "4" "Running tests" "npm test" || true
run_check "5" "Verifying build" "npm run build" || true
echo "============================================"
if [ $FAILED -eq 0 ]; then echo "✓ All checks passed for $PACKAGE_NAME!"; echo "============================================"; exit 0; else echo "✗ Some checks failed for $PACKAGE_NAME!"; echo "============================================"; exit 1; fi
