#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Build All Script for @simpill/patterns.utils
# =============================================================================
# Runs the complete build pipeline: clean, typecheck, format, lint, test, build.
# Use --help for usage information.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="patterns.utils"

cd "$PACKAGE_DIR"

# -----------------------------------------------------------------------------
# Default Options
# -----------------------------------------------------------------------------
SKIP_TESTS=false
RUN_DEV=false

# -----------------------------------------------------------------------------
# Help Text
# -----------------------------------------------------------------------------
show_help() {
  cat << EOF
Usage: ./scripts/build-all.sh [OPTIONS]
       npm run all [-- OPTIONS]

Runs the complete build pipeline for @simpill/$PACKAGE_NAME.

Steps executed:
  1. clean      - Remove dist/, coverage/, and cache directories
  2. typecheck  - Run TypeScript type checking (tsc --noEmit)
  3. format     - Format code with Biome
  4. lint:fix   - Run linter and auto-fix issues
  5. test       - Run Jest test suite (skippable with --skip-tests)
  6. build      - Compile TypeScript to dist/
  7. dev        - Start dev mode (only with --dev flag)

Options:
  --skip-tests    Skip the test step
  --dev           Run dev mode after successful build
  --help, -h      Show this help message

Examples:
  npm run all                     Run full pipeline
  npm run all -- --skip-tests     Skip test step
  npm run all -- --dev            Run dev after build
  npm run all -- --skip-tests --dev
  ./scripts/build-all.sh --help   Show this help

Exit Codes:
  0  All steps completed successfully
  1  One or more steps failed

EOF
  exit 0
}

# -----------------------------------------------------------------------------
# Argument Parsing
# -----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --dev)
      RUN_DEV=true
      shift
      ;;
    --help|-h)
      show_help
      ;;
    *)
      echo "Error: Unknown option '$1'"
      echo "Run with --help for usage information."
      exit 1
      ;;
  esac
done

# -----------------------------------------------------------------------------
# Step Runner
# -----------------------------------------------------------------------------
FAILED=0
STEP_COUNT=0
TOTAL_STEPS=6

if [ "$SKIP_TESTS" = true ]; then
  TOTAL_STEPS=$((TOTAL_STEPS - 1))
fi

if [ "$RUN_DEV" = true ]; then
  TOTAL_STEPS=$((TOTAL_STEPS + 1))
fi

run_step() {
  local step_name="$1"
  local command="$2"
  
  STEP_COUNT=$((STEP_COUNT + 1))
  
  echo ""
  echo "[$STEP_COUNT/$TOTAL_STEPS] $step_name"
  echo "----------------------------------------"
  
  if eval "$command"; then
    echo "[PASS] $step_name"
  else
    echo "[FAIL] $step_name"
    FAILED=1
    return 1
  fi
}

# -----------------------------------------------------------------------------
# Header
# -----------------------------------------------------------------------------
echo ""
echo "============================================"
echo "Build All: @simpill/$PACKAGE_NAME"
echo "============================================"

if [ "$SKIP_TESTS" = true ]; then
  echo "Option: --skip-tests (tests will be skipped)"
fi
if [ "$RUN_DEV" = true ]; then
  echo "Option: --dev (dev mode will run after build)"
fi

# -----------------------------------------------------------------------------
# Execute Pipeline
# -----------------------------------------------------------------------------
run_step "Clean" "npm run clean" || true
run_step "Type Check" "npm run typecheck" || true
run_step "Format" "npm run format" || true
run_step "Lint Fix" "npm run lint:fix" || true

if [ "$SKIP_TESTS" = false ]; then
  run_step "Test" "npm run test" || true
fi

run_step "Build" "npm run build" || true

if [ "$RUN_DEV" = true ] && [ "$FAILED" -eq 0 ]; then
  run_step "Dev" "npm run dev"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================"
if [ $FAILED -eq 0 ]; then
  echo "[PASS] All steps completed successfully"
  echo "============================================"
  exit 0
else
  echo "[FAIL] One or more steps failed"
  echo "============================================"
  echo ""
  echo "Review the output above to identify failures."
  echo "Run individual commands to debug:"
  echo "  npm run clean"
  echo "  npm run typecheck"
  echo "  npm run format"
  echo "  npm run lint:fix"
  echo "  npm run test"
  echo "  npm run build"
  echo ""
  exit 1
fi
