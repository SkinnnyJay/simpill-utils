# Monorepo Scripts

Scripts are grouped by purpose. Run from repo root unless noted. Use the npm scripts in root `package.json` (e.g. `npm run clean`, `npm run utils:verify`) or invoke scripts by path.

## Layout

```
scripts/
├── monorepo/     # Root deps, clean, verify
├── utils/        # Utils package: verify, prepare, metadata, keywords, readme
├── github/       # GitHub API: topics, repos public
├── publish/      # Publish to GitHub + npm
└── lib/          # Shared helpers (package-topics, publish-order, sync-repo-links)
```

## Monorepo (`scripts/monorepo/`)

| Script | npm | Description |
|--------|-----|-------------|
| `install-hooks.sh` | `npm run install:hooks` | Install root `.git/hooks/pre-commit` from package list; always emits valid bash (no empty then). Run after clone or when adding packages. |
| `monorepo-clean.sh` | `npm run clean` | Remove node_modules, package-lock.json, dist, coverage, .next, .jest-cache at root. |
| `monorepo-sync-deps.js` | `npm run sync:deps` | Sync root package.json @simpill deps to npm versions (^ from utils/ or ^1.0.0). |
| `use-local-utils-at-root.js` | `npm run use:local` | Point root deps at local utils (file:./utils/...) and run npm install. Restore with `npm run sync:deps`. |
| `monorepo-verify-deps.js` | `npm run verify:deps` | Verify all @simpill deps resolve and load. Run after npm install. |

## Utils (`scripts/utils/`)

| Script | npm | Description |
|--------|-----|-------------|
| `utils-verify-all.sh` | `npm run utils:verify` | Build and test every package under utils/@simpill-*.utils. |
| `utils-prepare-all.sh` | `npm run utils:prepare` | Per package: npm install, audit --fix, typecheck, test, build. Prepares packages for npm. |
| `utils-fix-repo-metadata.js` | `npm run utils:fix-metadata` | Fix repository, bugs, homepage in each utils package; replace file: deps with github: spec. |
| `utils-set-npm-keywords.js` | `npm run utils:keywords` | Set package.json keywords from TOPICS.md or `lib/package-topics.js`. Options: `--dry-run`, `--write-topics-md`. |
| `utils-update-readme-badges.js` | (manual) | Add npm/GitHub badges and install section to each utils README. |
| `utils-use-local-deps.js` | (manual) | Rewrite utils packages to use file:../@simpill-*.utils for local dev. |

## GitHub (`scripts/github/`)

| Script | npm | Description |
|--------|-----|-------------|
| `github-set-repo-topics.sh` | `npm run github:topics:repo` | Set this repo's topics from .github/TOPICS.md (gh + jq). |
| `github-set-all-topics.js` | `npm run github:topics` | Set topics for monorepo and all package repos. Options: `--dry-run`, `--packages-only`. |
| `github-set-repos-public.sh` | `npm run github:repos-public` | Set each @simpill package repo to public. Use `DRY_RUN=1` to preview. |

## Publish (`scripts/publish/`)

| Script | npm | Description |
|--------|-----|-------------|
| `publish-all.sh` | `npm run publish` | Push to GitHub and publish all packages to npm in dependency order. Options: `--dry-run`, `--skip-github`, `--yes`. |

## Shared lib (`scripts/lib/`)

| Script | Description |
|--------|-------------|
| `publish-order.js` | Used by publish-all: topological order and package.json rewrite (file: → ^version). |
| `package-topics.js` | Topic lists for utils keywords and GitHub topics. |
| `sync-repo-links.js` | (manual) Set repo/homepage/bugs to a single monorepo base. `REPO_BASE=... BRANCH=main node scripts/lib/sync-repo-links.js`. |
