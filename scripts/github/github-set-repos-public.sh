#!/usr/bin/env bash
# Set each @simpill package GitHub repo from private to public.
#
# This action is IRREVERSIBLE in practice: publishing a repo exposes its full
# git history, and re-privatizing does not recall clones, forks, or search
# indexes. The script therefore defaults to a dry run and refuses to mutate
# anything until every guard below passes.
#
# Usage:
#   ./scripts/github/github-set-repos-public.sh              # dry run (default)
#   APPLY=1 ./scripts/github/github-set-repos-public.sh      # mutate, with confirmation
#   APPLY=1 ASSUME_YES=1 GITHUB_OWNER=SkinnnyJay \
#     ./scripts/github/github-set-repos-public.sh               # non-interactive
#
# Guards:
#   1. Dry run is the default; mutation requires APPLY=1.
#   2. The target repo list is derived from utils/@simpill-*.utils/ on disk,
#      not a hand-maintained list that can drift.
#   3. Each remote repo must have a package.json whose "name" starts with
#      "@simpill/" before it is touched, so a same-named unrelated repo is skipped.
#   4. The owner must be confirmed interactively (or pinned via GITHUB_OWNER
#      together with ASSUME_YES=1).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
UTILS_DIR="$REPO_ROOT/utils"

# Naming convention and identity checks, named once so the guards cannot drift
# apart from the layout they describe.
readonly SCOPE="@simpill/"                 # npm scope every package here belongs to
readonly DIR_PREFIX="@simpill-"            # utils/@simpill-<name>.utils
readonly DIR_GLOB="@simpill-*.utils"
readonly VISIBILITY_PUBLIC="public"

APPLY="${APPLY:-}"
ASSUME_YES="${ASSUME_YES:-}"

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) not found."
  exit 1
fi

GITHUB_OWNER="${GITHUB_OWNER:-$(gh api user -q .login 2>/dev/null || echo '')}"
if [[ -z "$GITHUB_OWNER" ]]; then
  echo "Error: Could not determine GitHub user. Run 'gh auth login' or set GITHUB_OWNER."
  exit 1
fi

# Guard 2: derive the package list from disk, excluding git submodules.
# Submodules live in their own repositories and are not ours to publish; the
# same predicate bug (matching a bare ".utils" suffix) is what let the publish
# pipeline try to npm-publish the acp-llm-cli submodule.
SUBMODULE_DIRS=()
if [[ -f "$REPO_ROOT/.gitmodules" ]]; then
  while IFS= read -r sub; do
    SUBMODULE_DIRS+=("$(basename "$sub")")
  done < <(git -C "$REPO_ROOT" config --file .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $2}')
fi

is_submodule() {
  local name="$1"
  (( ${#SUBMODULE_DIRS[@]} == 0 )) && return 1
  local s
  for s in "${SUBMODULE_DIRS[@]}"; do
    [[ "$s" == "$name" ]] && return 0
  done
  return 1
}

REPOS=()
while IFS= read -r dir; do
  base="$(basename "$dir")"                 # @simpill-<name>.utils
  if is_submodule "$base"; then
    echo "Excluding $base (git submodule — not ours to publish)"
    continue
  fi
  REPOS+=("${base#"$DIR_PREFIX"}")          # <name>.utils
done < <(find "$UTILS_DIR" -maxdepth 1 -type d -name "$DIR_GLOB" | sort)

if [[ ${#REPOS[@]} -eq 0 ]]; then
  echo "Error: no @simpill-*.utils directories found under $UTILS_DIR"
  exit 1
fi

echo "Owner:   $GITHUB_OWNER"
echo "Repos:   ${#REPOS[@]} derived from $UTILS_DIR"
if [[ -z "$APPLY" ]]; then
  echo "Mode:    DRY RUN (set APPLY=1 to make changes)"
else
  echo "Mode:    APPLY — repositories will be made PUBLIC and this cannot be undone"
fi
echo

# Guard 4: confirm the owner before any mutation.
if [[ -n "$APPLY" && -z "$ASSUME_YES" ]]; then
  echo "About to make up to ${#REPOS[@]} repositories under '$GITHUB_OWNER' PUBLIC."
  echo "This exposes their full git history permanently."
  printf "Type the owner name to confirm: "
  read -r confirm
  if [[ "$confirm" != "$GITHUB_OWNER" ]]; then
    echo "Aborted (got '$confirm', expected '$GITHUB_OWNER')."
    exit 1
  fi
fi

CHANGED=0
SKIPPED=0
WOULD_CHANGE=0

for repo in "${REPOS[@]}"; do
  full="$GITHUB_OWNER/$repo"

  # One call answers both "does it exist" and "is it already public".
  visibility="$(gh api "repos/$full" -q .visibility 2>/dev/null || echo '')"
  if [[ -z "$visibility" ]]; then
    echo "Skip $full (repo not found)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  if [[ "$visibility" == "$VISIBILITY_PUBLIC" ]]; then
    echo "Skip $full (already public)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Guard 3: the remote must actually be a @simpill package. The raw media type
  # returns the file itself, so gh's --jq reads .name directly — no base64 hop
  # and no node dependency, both of which varied by platform.
  remote_name="$(gh api "repos/$full/contents/package.json" \
    -H "Accept: application/vnd.github.raw" --jq .name 2>/dev/null || echo '')"
  if [[ "$remote_name" != "$SCOPE"* ]]; then
    echo "Skip $full (remote package.json name is '${remote_name:-<none>}', not ${SCOPE}*)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ -z "$APPLY" ]]; then
    echo "Would set $full -> $VISIBILITY_PUBLIC  (verified $remote_name)"
    WOULD_CHANGE=$((WOULD_CHANGE + 1))
    continue
  fi

  gh repo edit "$full" --visibility "$VISIBILITY_PUBLIC" --accept-visibility-change-consequences

  echo "Set $full to $VISIBILITY_PUBLIC  (verified $remote_name)"
  CHANGED=$((CHANGED + 1))
done

echo
if [[ -z "$APPLY" ]]; then
  echo "Dry run complete. No changes made.  Would change: $WOULD_CHANGE  Skipped: $SKIPPED"
  if (( WOULD_CHANGE > 0 )); then
    echo "Re-run with APPLY=1 to apply."
  fi
else
  echo "Done. Changed: $CHANGED  Skipped: $SKIPPED"
fi
