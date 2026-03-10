#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Pre-Push Hook Entry Point for @simpill/factories.utils
# =============================================================================
# This script is called by the git pre-push hook. It delegates to check.sh
# which runs all the quality checks.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_NAME="factories.utils"

echo "[$PACKAGE_NAME] Running pre-push hook..."

# Run the full check suite
"$SCRIPT_DIR/check.sh"

exit $?
