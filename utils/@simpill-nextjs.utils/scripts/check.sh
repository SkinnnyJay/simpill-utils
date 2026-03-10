#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running pre-push checks for nextjs.utils"
echo "--------------------------------------"

echo "[1/5] Checking format..."
npm run format:check
echo "[2/5] Running linter..."
npm run lint
echo "[3/5] Running type check..."
npx tsc --noEmit
echo "[4/5] Running tests..."
npm test
echo "[5/5] Verifying build..."
npm run build
echo "--------------------------------------"
echo "All checks passed."
