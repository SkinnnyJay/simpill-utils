---
description: Run E2E tests and fix failures systematically; follow fixing workflow.
---

# E2E

## Overview

Run E2E tests (e.g. Playwright) and fix any failures. When fixing, follow the project’s fixing workflow (see rules). Use the project’s E2E command (e.g. `make e2e`, `npm run test:e2e`, `npx playwright test`).

## Steps

1. **Run E2E** — Execute the E2E script; discover all failures; check report path (e.g. playwright-report, test-results).
2. **Task list** — Catalog each failing spec (file, test name, description); mark pending.
3. **Fix one at a time** — Fix one spec; verify with single-spec run (e.g. `npx playwright test <spec-file>`); mark done when it passes. Use `--trace on` for debugging if needed.
4. **No full suite** until all items resolved.
5. **Full confirmation** — Re-run full E2E; then lint and typecheck.

## Checklist

- [ ] All E2E failures cataloged
- [ ] Each spec fixed and verified individually
- [ ] Full E2E run passes
- [ ] Lint and typecheck pass
