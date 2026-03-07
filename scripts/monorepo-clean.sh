#!/usr/bin/env bash
# Clean monorepo root: node_modules, lockfile, and build artifacts.
set -euo pipefail
REPO_ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_ROOT"
rm -rf node_modules package-lock.json dist coverage .next .jest-cache 2>/dev/null || true
echo "Monorepo root cleaned (node_modules, package-lock.json, dist, coverage, .next, .jest-cache)."
