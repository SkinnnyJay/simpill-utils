---
description: Generate test coverage report and identify low-coverage areas. Use to assess test health and suggest tests for gaps.
---

# Coverage Report

## Overview

Generate a test coverage report and identify low-coverage areas. Use to assess test health and suggest tests for gaps.

**Context:** This repo enforces **80%** minimum coverage (branches, functions, lines, statements). For a single util package: `cd utils/@simpill-<name>.utils && npm run test:coverage`. From root: `make utils-test` with coverage or run per-package.

## Steps

1. **Run coverage**
   - Run `npm run test:coverage` (in package) or equivalent from root.

2. **Locate artifacts**
   - Confirm report and artifacts (e.g. `coverage/` or `.generated/coverage/` per project).

3. **Summarize**
   - Report overall percentages: lines, branches, functions, statements.

4. **Flag gaps**
   - Identify files below the 80% coverage threshold.

5. **Suggest tests**
   - Recommend specific tests or scenarios for low-coverage areas.

## Checklist

- [ ] Coverage run completed
- [ ] Artifacts present (e.g. `coverage/` or `.generated/coverage/`)
- [ ] Summary with percentages provided
- [ ] Files below 80% flagged
- [ ] Suggestions for low-coverage areas provided
