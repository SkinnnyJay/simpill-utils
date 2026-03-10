#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running pre-push checks for react.utils"
echo "--------------------------------------"

echo "[1/5] Checking format..."
npm run format:check
echo "Format check passed."

echo "[2/5] Running linter..."
npm run lint
echo "Lint check passed."

echo "[3/5] Running type check..."
npx tsc --noEmit
echo "Type check passed."

echo "[4/5] Running tests..."
npm test
echo "Tests passed."

echo "[5/5] Verifying build..."
npm run build
echo "Build completed."

echo "--------------------------------------"
echo "All checks passed."
