---
description: Review changes for quality, correctness, and conventions; report with severity and file:line.
---

# Review

## Overview

Review current changes for quality, correctness, and project conventions. Report findings with clear severity and file:line references. Use `git diff` (or `git diff --staged`) to inspect changes.

## Steps

1. **Inspect changes** — Run `git diff` (and `git diff --staged` if needed) to see all changes.
2. **Review against criteria** — Logic errors, null handling, race conditions; private members use language keyword (no underscore prefix); typed validation for external data where applicable; no `any` or lint-disable without justification; size limits per project (function/file).
3. **Report findings** — Use severity: MUST FIX, SHOULD FIX, SUGGESTION. Include file:line for each finding.

## Checklist

- [ ] Logic and edge cases reviewed
- [ ] Naming and style match project conventions
- [ ] No inappropriate `any` or disables
- [ ] Conventions from CLAUDE.md / .cursorrules followed
- [ ] Size limits considered
