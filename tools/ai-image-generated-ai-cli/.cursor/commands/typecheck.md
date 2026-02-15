---
description: Run type checking and fix all type errors; follow fixing workflow.
---

# Typecheck

## Overview

Run type checking and fix all type errors. When fixing, follow the project’s fixing workflow (see rules). Use the project’s command: from root `make typecheck` (if defined) or from package `npm run typecheck` / `npx tsc --noEmit`.

## Steps

1. **Run typecheck** — Get full output; list every error (file, line, message).
2. **Task list** — Catalog each error; mark pending.
3. **Fix one at a time** — Minimal fix; no `any`, `@ts-ignore`, or `as`. Use type guards, narrowing, or generics. Verify with typecheck; mark done when that error is gone.
4. **Full confirmation** — Run typecheck until exit 0; then run lint as final gate.

## Checklist

- [ ] All type errors cataloged
- [ ] Each fixed without `any` or `as`
- [ ] Full typecheck passes
- [ ] Lint passes
