#!/usr/bin/env bash
# Push each @simpill-*.utils package to its own private GitHub repo.
# Usage: run from repo root. Requires: gh CLI, jq. Repos created under authenticated user (e.g. SkinnnyJay).
set -euo pipefail

UTILS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$UTILS_DIR/../.." && pwd)"
TEMP_BASE="${TEMP_BASE:-/tmp/simpill-push}"
DRY_RUN="${DRY_RUN:-}"

# Resolve GitHub owner from gh auth
GITHUB_OWNER="${GITHUB_OWNER:-$(gh api user -q .login 2>/dev/null || echo '')}"
if [[ -z "$GITHUB_OWNER" ]]; then
  echo "Error: Could not get GitHub user. Run: gh auth login"
  exit 1
fi

echo "Using GitHub owner: $GITHUB_OWNER"
echo "Utils dir: $UTILS_DIR"
echo "Temp base: $TEMP_BASE"
[[ -n "$DRY_RUN" ]] && echo "DRY RUN (repos created but no push)"

mkdir -p "$TEMP_BASE"

for dir in "$UTILS_DIR"/@simpill-*.utils; do
  [[ -d "$dir" ]] || continue
  pkg_name=$(basename "$dir")
  repo_name="${pkg_name#@simpill-}"
  pkg_json="$dir/package.json"
  if [[ ! -f "$pkg_json" ]]; then
    echo "Skip $pkg_name (no package.json)"
    continue
  fi
  desc=$(jq -r '.description // "TypeScript utility package '"$repo_name"'"' "$pkg_json")
  repo_url="https://github.com/${GITHUB_OWNER}/${repo_name}.git"
  echo "--- $pkg_name -> $repo_name ---"

  # Create private repo if it does not exist
  if ! gh repo view "$GITHUB_OWNER/$repo_name" &>/dev/null; then
    gh repo create "$GITHUB_OWNER/$repo_name" --private --description "$desc"
  fi

  [[ -n "$DRY_RUN" ]] && continue

  dest="$TEMP_BASE/$repo_name"
  rm -rf "$dest"
  mkdir -p "$dest"

  # For env.utils, build so dist/ is included (monolith install from GitHub needs it)
  if [[ "$repo_name" == "env.utils" ]]; then
    PROTO_DIR="$UTILS_DIR/@simpill-protocols.utils"
    if [[ -d "$PROTO_DIR" ]] && [[ -f "$PROTO_DIR/package.json" ]]; then
      (cd "$PROTO_DIR" && npm install --ignore-scripts 2>/dev/null; npm run build 2>/dev/null) || true
      mkdir -p "$dir/node_modules/@simpill/protocols.utils"
      rsync -a "$PROTO_DIR/dist/" "$dir/node_modules/@simpill/protocols.utils/dist/" 2>/dev/null || true
    fi
    (cd "$dir" && npm run build 2>/dev/null) || true
  fi

  # Copy package (exclude build artifacts and deps; include dist for env.utils)
  RSYNC_EXCLUDES=(--exclude='node_modules' --exclude='coverage' --exclude='.jest-cache' --exclude='*.tgz' --exclude='.DS_Store')
  [[ "$repo_name" != "env.utils" ]] && RSYNC_EXCLUDES+=(--exclude='dist')
  rsync -a "${RSYNC_EXCLUDES[@]}" "$dir/" "$dest/"

  # Update package.json for standalone repo
  node -e "
    const fs = require('fs');
    const p = '$dest/package.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const repo = '$repo_name';
    const owner = '$GITHUB_OWNER';
    const base = 'https://github.com/' + owner + '/' + repo;
    j.repository = { type: 'git', url: base + '.git' };
    j.bugs = { url: base + '/issues' };
    j.homepage = base + '#readme';
    if (j.dependencies) {
      for (const k of Object.keys(j.dependencies)) {
        const v = j.dependencies[k];
        if (typeof v !== 'string') continue;
        if (v.startsWith('file:../@simpill-')) {
          const repoName = v.replace(/^file:\.\.\/@simpill-/, '');
          j.dependencies[k] = 'github:' + owner + '/' + repoName;
        }
      }
    }
    fs.writeFileSync(p, JSON.stringify(j, null, 2));
  "

  (cd "$dest" && git init -b main && git add -A && git commit -m "Initial commit: @simpill/$repo_name" && git remote add origin "$repo_url" && git push -u origin main)
  echo "Pushed $repo_name"
done

echo "Done. Temp dir: $TEMP_BASE"
