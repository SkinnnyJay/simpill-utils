---
description: Review changes for quality, correctness, and project conventions. Report findings with severity and file:line.
---

# Code Review

## Overview

Review current changes for quality, correctness, and project conventions. Report findings with clear severity and file:line references.

## Steps

1. **Inspect changes**
   - Run `git diff` to see all changes

2. **Review against criteria**
   - Logic errors, null handling, race conditions
   - Private members use `private` keyword (no underscore prefix)
   - Typed validation for external data where applicable (e.g. Zod)
   - No `any` types; no lint-disable without justification
   - Size limits per project (e.g. function/file; see CONTRIBUTING)

3. **Report findings**
   - Use severity: MUST FIX, SHOULD FIX, SUGGESTION
   - Include file:line references for each finding

## Review Checklist

- [ ] Logic and edge cases reviewed
- [ ] Naming and style match project conventions
- [ ] No inappropriate `any` or disables
- [ ] Conventions from CONTRIBUTING/CLAUDE followed
- [ ] Size limits (function/file) considered
