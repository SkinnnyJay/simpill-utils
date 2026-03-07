#!/usr/bin/env bash
# Set each @simpill package GitHub repo from private to public.
# Usage: run from repo root. Requires: gh CLI. Set GITHUB_OWNER if not using your user.
#   DRY_RUN=1 ./scripts/github-set-repos-public.sh   # list only, no changes
set -euo pipefail

GITHUB_OWNER="${GITHUB_OWNER:-$(gh api user -q .login 2>/dev/null || echo '')}"
if [[ -z "$GITHUB_OWNER" ]]; then
  echo "Error: Could not get GitHub user. Run: gh auth login or set GITHUB_OWNER"
  exit 1
fi

REPOS=(
  adapters.utils
  algorithms.utils
  annotations.utils
  api.utils
  array.utils
  async.utils
  cache.utils
  collections.utils
  crypto.utils
  data.utils
  env.utils
  enum.utils
  errors.utils
  events.utils
  factories.utils
  file.utils
  function.utils
  http.utils
  logger.utils
  middleware.utils
  misc.utils
  nextjs.utils
  number.utils
  object.utils
  observability.utils
  patterns.utils
  protocols.utils
  react.utils
  request-context.utils
  resilience.utils
  socket.utils
  string.utils
  test.utils
  time.utils
  token-optimizer.utils
  uuid.utils
  zod.utils
  zustand.utils
)

echo "Owner: $GITHUB_OWNER"
[[ -n "${DRY_RUN:-}" ]] && echo "DRY RUN (no visibility changes)"

for repo in "${REPOS[@]}"; do
  full="$GITHUB_OWNER/$repo"
  if ! gh repo view "$full" &>/dev/null; then
    echo "Skip $full (repo not found)"
    continue
  fi
  if [[ -n "${DRY_RUN:-}" ]]; then
    echo "Would set $full -> public"
    continue
  fi
  gh repo edit "$full" --visibility public --accept-visibility-change-consequences
  echo "Set $full to public"
done

echo "Done."
