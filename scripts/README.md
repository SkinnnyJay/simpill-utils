# Monorepo Scripts

Scripts follow a consistent naming prefix: `monorepo-`, `utils-`, `github-`, or `publish-`. Run from repo root unless noted.

## Monorepo (root operations)

| Script | npm | Description |
|--------|-----|-------------|
| `monorepo-clean.sh` | `npm run clean` | Remove node_modules, package-lock.json, dist, coverage, .next, .jest-cache at root. |
| `monorepo-sync-deps.js` | `npm run sync:deps` | Sync root package.json dependencies from utils/@simpill-*.utils (github: spec). |
| `use-local-utils-at-root.js` | `npm run use:local` | Point root deps at local utils (file:./utils/...) and run npm install. Use so root build, test:smoke, and tests run against built local packages. Restore with `npm run sync:deps`. |
| `monorepo-verify-deps.js` | `npm run verify:deps` | Verify all @simpill deps resolve and load. Run after npm install. |

## Utils packages

| Script | npm | Description |
|--------|-----|-------------|
| `utils-verify-all.sh` | `npm run utils:verify` | Build and test every package under utils/@simpill-*.utils. |
| `utils-prepare-all.sh` | `npm run utils:prepare` | Per package: npm install, npm audit --fix, npm run typecheck, npm test, npm run build. Fix any reported failures and re-run until clean; prepares packages for npm. |
| `utils-fix-repo-metadata.js` | `npm run utils:fix-metadata` | Fix repository, bugs, homepage in each utils package for standalone GitHub repos; replace file: deps with github: spec. |
| `utils-set-npm-keywords.js` | `npm run utils:keywords` | Set each package’s `package.json` keywords from its `TOPICS.md` (if present) or from `scripts/lib/package-topics.js`. Options: `--dry-run`, `--write-topics-md` (create TOPICS.md in each package). |

## GitHub API

| Script | npm | Description |
|--------|-----|-------------|
| `github-set-repo-topics.sh` | `npm run github:topics:repo` | Set this repo’s topics from .github/TOPICS.md (gh + jq). |
| `github-set-all-topics.js` | `npm run github:topics` | Set topics for this monorepo and all package repos from package.json. Options: `--dry-run`, `--packages-only`. |
| `github-set-repos-public.sh` | `npm run github:repos-public` | Set each @simpill package repo to public. Use `DRY_RUN=1` to preview. |

## Publish

| Script | npm | Description |
|--------|-----|-------------|
| `publish-all.sh` | `npm run publish` | Push to GitHub and publish all packages to npm in dependency order. Options: `--dry-run`, `--skip-github`, `--yes`. |
| `lib/publish-order.js` | (used by publish-all) | Topological publish order and package.json rewrite (file: → ^version). |
| `lib/sync-repo-links.js` | (manual) | Set repo/homepage/bugs to a single monorepo base. `REPO_BASE=... BRANCH=main node scripts/lib/sync-repo-links.js`. |
