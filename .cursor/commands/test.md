---
description: Run full test suite and fix failures systematically. Follow the fixing workflow when resolving failures.
---

# Run Tests

## Overview

Execute the full test suite and systematically fix any failures. When fixing failures, follow the project's fixing workflow (see project rules).

**Context:** This repo is a monorepo. For a **single util package**: `cd utils/@simpill-<name>.utils && npm test` (Jest). For **all utils** from repo root: `make utils-test` or `make utils-verify`. Sandbox E2E: see the e2e command.

## Steps

1. **Run test suite**
   - In a package: `npm test`. From root for all utils: `make utils-test`.
   - Read the complete output and capture every failing test.

2. **Create task list**
   - Catalog every failing test: file path, test name, short description.
   - Mark all items as pending.

3. **Fix issues systematically**
   - Fix one test at a time.
   - Read the test and source file to understand root cause.
   - Apply minimal fix.
   - Verify with: `npx jest <test-file>` (utils) or project test runner.
   - Mark done only after it passes.

4. **Do not re-run full suite** until every item is individually resolved.

5. **Full confirmation**
   - Run `npm test` (in package) or `make utils-test`.
   - If regressions appear, add them to the task list and fix.

6. **Final gate:** `npm run lint && npm run typecheck` (in package).

## Checklist

- [ ] All test failures cataloged in task list
- [ ] Each failure fixed and verified individually
- [ ] Full test run passes (package or make target)
- [ ] Lint and typecheck pass
