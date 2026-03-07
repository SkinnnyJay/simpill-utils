#!/usr/bin/env bash
# Set this repository's GitHub topics from .github/TOPICS.md using the GitHub API.
# Requires: gh CLI (authenticated), jq. GitHub allows at most 20 topics.
set -e

SCRIPT_DIR="${BASH_SOURCE%/*}"
REPO_ROOT="${SCRIPT_DIR}/.."
TOPICS_FILE="${REPO_ROOT}/.github/TOPICS.md"
MAX_TOPICS=20

if [[ ! -f "$TOPICS_FILE" ]]; then
  echo "Missing $TOPICS_FILE" >&2
  exit 1
fi

# Extract topic names from lines like: - `topic-name`
topics_raw=$(grep -E '^\s*-\s*`[^`]+`' "$TOPICS_FILE" | sed -n 's/.*`\([^`]*\)`.*/\1/p')
# Take first MAX_TOPICS (GitHub limit)
topics_list=$(echo "$topics_raw" | head -n "$MAX_TOPICS" | jq -R -s -c 'split("\n") | map(select(length > 0))')

payload=$(jq -n --argjson names "$topics_list" '{ names: $names }')

cd "$REPO_ROOT"
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "Setting ${repo} topics (from .github/TOPICS.md, max ${MAX_TOPICS})..."
gh api -X PUT \
  -H "Accept: application/vnd.github.mercy-preview+json" \
  "repos/${repo}/topics" \
  --input - <<< "$payload"
echo "Done. Current topics:"
gh api "repos/${repo}/topics" -H "Accept: application/vnd.github.mercy-preview+json" -q '.names[]' | paste -sd ' ' -
echo
