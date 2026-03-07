# Suggested GitHub repository topics

Add these topics to your GitHub repo (Settings → General → Topics) so the repo appears when people search for these terms.

**Set programmatically:** From repo root, run `./scripts/github-set-repo-topics.sh` (requires `gh` CLI authenticated and `jq`). This replaces the repo’s topics with the list below, up to GitHub’s limit of 20.

**Set topics on this repo and all @simpill package repos:** Run `npm run github:topics` or `node scripts/github-set-all-topics.js` (requires `gh` authenticated). Use `--packages-only` to update only package repos, or `--dry-run` to preview.

## Core

- `simpill`
- `simpill-utils`
- `typescript`
- `utilities`
- `monorepo`

## Runtime & platform

- `nodejs`
- `edge-runtime`
- `nextjs`
- `react`

## Language & style

- `type-safe`
- `strict-mode`
- `tree-shakeable`
- `esm`

## Use-case

- `env`
- `logging`
- `cache`
- `http`
- `validation`
- `zod`
- `uuid`
- `testing`

Pick the ones that best describe the repo (GitHub allows up to 20 topics). Every package in this monorepo is published to npm with `simpill` and package-specific keywords so `npm search simpill` and related queries surface them.
