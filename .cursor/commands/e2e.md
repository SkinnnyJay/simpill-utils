---
description: Run E2E tests and fix failures systematically. Follow the fixing workflow when resolving failures.
---

# Run E2E Tests

## Overview

Execute Playwright E2E tests and systematically fix any failures. When fixing failures, follow the project's fixing workflow (see project rules).

## Steps

1. **Run E2E suite**
   - **Sandbox (simpill-sandbox repo):** Clone [simpill-sandbox](https://github.com/simpill/simpill-sandbox), then `cd todo-app && npm run test:e2e` (Playwright).
   - Discover ALL failures; check report path (e.g. playwright-report, test-results).

2. **Create task list**
   - Catalog every failing spec: file path, test name, short description
   - Mark all items as pending

3. **Fix issues systematically**
   - Fix one spec at a time
   - Read the spec file and relevant source code
   - Apply minimal fix
   - Verify with: `npx playwright test <spec-file>`
   - For debugging: `npx playwright test <spec-file> --trace on`
   - Mark done only after it passes

4. **Do not re-run full suite** until all items are individually resolved

5. **Full confirmation**
   - Re-run the project's E2E script; handle any regressions

6. **Final gate:** `npm run lint && npm run typecheck`

## Checklist

- [ ] All E2E failures cataloged in task list
- [ ] Each spec fixed and verified individually
- [ ] Full E2E run passes
- [ ] Lint and typecheck pass
