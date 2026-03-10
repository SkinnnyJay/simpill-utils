#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_NAME="zod.utils"

echo "[$PACKAGE_NAME] Running pre-push hook..."
"$SCRIPT_DIR/check.sh"
exit $?
