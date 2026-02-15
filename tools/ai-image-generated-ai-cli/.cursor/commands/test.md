---
description: Run test suite and fix failures systematically; follow fixing workflow.
---

# Test

## Overview

Run the test suite and fix any failures. When fixing, follow the project’s fixing workflow (see rules). Use the project’s command: from root `make test` (if defined) or from package `npm test` / project test script.

## Steps

1. **Run tests** — Execute the test command; read full output; list every failing test (file, test name, message).
2. **Task list** — Catalog each failure; mark pending.
3. **Fix one at a time** — Read test and source; apply minimal fix; verify with the single test file or scope; mark done when it passes.
4. **No full suite** until every item is resolved.
5. **Full confirmation** — Re-run full test suite; then lint and typecheck as final gate.

## Checklist

- [ ] All test failures cataloged
- [ ] Each fixed and verified individually
- [ ] Full test run passes
- [ ] Lint and typecheck pass
