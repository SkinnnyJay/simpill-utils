---
description: Fix linting and formatting; follow fixing workflow.
---

# Lint

## Overview

Fix all linting and formatting issues. When fixing, follow the project’s fixing workflow (see rules). Use the project’s commands (e.g. `make lint`, `npm run lint`, `npm run check:fix`, or linter-specific fix flags).

## Steps

1. **Run lint** — Execute lint (and format check if separate); read full output.
2. **Auto-fix** — Run any fix-on-save or fix command (e.g. `npm run lint -- --fix`, `npm run format`, Biome/ESLint fix).
3. **Task list** — Run lint again; catalog every remaining issue (file, rule, description); mark pending.
4. **Fix one at a time** — Minimal fix per issue; verify with linter on that file; mark done when it passes.
5. **Full confirmation** — Run full lint; then typecheck.

## Checklist

- [ ] Auto-fix applied
- [ ] All remaining issues cataloged
- [ ] Each issue fixed and verified per file
- [ ] Full lint passes
- [ ] Typecheck passes
