#!/usr/bin/env bash
# =============================================================================
# Publish all @simpill packages to GitHub (push) and npm in dependency order.
# Requires: gh (GitHub CLI) and npm logged in with access to @simpill scope.
# =============================================================================
# Usage:
#   ./scripts/publish/publish-all.sh              # GitHub push + npm publish (prompts)
#   ./scripts/publish/publish-all.sh --dry-run   # No push, npm publish --dry-run
#   ./scripts/publish/publish-all.sh --yes       # Skip confirmations
#   ./scripts/publish/publish-all.sh --otp=123456 # 2FA one-time password for npm
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$REPO_ROOT/scripts/lib"

DRY_RUN=false
SKIP_GITHUB=false
YES=false
NPM_OTP=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)      DRY_RUN=true ;;
    --skip-github) SKIP_GITHUB=true ;;
    --npm-only)    SKIP_GITHUB=true ;;
    --yes|-y)      YES=true ;;
    --otp=*)       NPM_OTP="${arg#--otp=}" ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--dry-run] [--skip-github|--npm-only] [--yes|-y] [--otp=CODE]"
      exit 1
      ;;
  esac
done

echo "============================================"
echo "Publish all @simpill packages"
echo "============================================"
echo "  --dry-run:     $DRY_RUN"
echo "  --skip-github: $SKIP_GITHUB"
echo "  --yes:         $YES"
echo "  --otp:         ${NPM_OTP:+<set>}"
echo "============================================"

# -----------------------------------------------------------------------------
# 1. Check GitHub CLI and auth (unless skipped)
# -----------------------------------------------------------------------------
if [ "$SKIP_GITHUB" = false ]; then
  if ! command -v gh &>/dev/null; then
    echo "Error: GitHub CLI (gh) not found. Install it or use --skip-github."
    exit 1
  fi
  if ! gh auth status &>/dev/null; then
    echo "Error: Not logged in to GitHub. Run: gh auth login"
    exit 1
  fi
  if [ "$DRY_RUN" = false ] && [ "$YES" = false ]; then
    echo "GitHub: will push current branch. Continue? [y/N]"
    read -r ans
    if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
      echo "Aborted."
      exit 0
    fi
  fi
  if [ "$DRY_RUN" = false ]; then
    echo "Pushing to GitHub..."
    git -C "$REPO_ROOT" push
    echo "GitHub push done."
  else
    echo "[dry-run] Skipping GitHub push."
  fi
fi

# -----------------------------------------------------------------------------
# 2. Check npm auth and @simpill scope
# -----------------------------------------------------------------------------
if ! command -v npm &>/dev/null; then
  echo "Error: npm not found."
  exit 1
fi
if ! npm whoami &>/dev/null; then
  echo "Error: Not logged in to npm. Run: npm login"
  exit 1
fi
if [ "$DRY_RUN" = false ] && [ "$YES" = false ]; then
  echo "Publish all packages to npm under @simpill? [y/N]"
  read -r ans
  if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

# -----------------------------------------------------------------------------
# 3. Get publish order (topological)
# -----------------------------------------------------------------------------
ORDER=()
while IFS= read -r line; do
  [ -n "$line" ] && ORDER+=("$line")
done < <(node "$LIB_DIR/publish-order.js" order "$REPO_ROOT")

echo "Publish order (${#ORDER[@]} packages):"
for d in "${ORDER[@]}"; do
  echo "  - $d"
done

# -----------------------------------------------------------------------------
# 4. Publish each package: backup package.json, rewrite file: -> ^ver, publish, restore
# -----------------------------------------------------------------------------
FAILED=()
for dir in "${ORDER[@]}"; do
  pkg_path="$REPO_ROOT/utils/$dir/package.json"
  if [ ! -f "$pkg_path" ]; then
    echo "  Skip $dir (no package.json)"
    continue
  fi
  name=$(node -e "console.log(require('$pkg_path').name)")
  echo "----------------------------------------"
  echo "Publishing: $name ($dir)"
  echo "----------------------------------------"
  backup="$pkg_path.publish-backup"
  tmp="$pkg_path.publish-tmp"
  cp "$pkg_path" "$backup"
  trap "mv -f '$backup' '$pkg_path'; rm -f '$tmp'" EXIT
  node "$LIB_DIR/publish-order.js" rewrite "$dir" "$REPO_ROOT" > "$tmp" && mv -f "$tmp" "$pkg_path"
  # Gate: rewritten manifest must not ship file: deps
  if grep -q '"file:' "$pkg_path"; then
    echo "ERROR: $name still has file: deps after rewrite — aborting publish"
    mv -f "$backup" "$pkg_path"
    trap - EXIT
    FAILED+=("$name (file: after rewrite)")
    continue
  fi
  set +e
  if [ "$DRY_RUN" = true ]; then
    (cd "$REPO_ROOT/utils/$dir" && npm publish --access public --dry-run)
  else
    # --provenance requires OIDC token from CI (GitHub Actions with id-token: write permission)
    (cd "$REPO_ROOT/utils/$dir" && npm publish --access public --provenance ${NPM_OTP:+--otp="$NPM_OTP"})
  fi
  ret=$?
  set -e
  mv -f "$backup" "$pkg_path"
  trap - EXIT
  if [ $ret -ne 0 ]; then
    echo "  FAILED: $name"
    FAILED+=("$name")
  else
    echo "  OK: $name"
  fi
done

echo ""
echo "============================================"
echo "Publish summary"
echo "============================================"
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "All packages published successfully."
  exit 0
fi
echo "Failed: ${FAILED[*]}"
exit 1
