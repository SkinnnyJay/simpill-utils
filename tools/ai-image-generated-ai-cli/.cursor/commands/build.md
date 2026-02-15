---
description: Run production build and fix compilation errors; follow fixing workflow.
---

# Build

## Overview

Run the production build and fix any compilation errors. When fixing errors, follow the project’s fixing workflow (see rules).

Use the project’s build entrypoint: from repo root `make build` (or the project’s Makefile target), or from a package directory `npm run build`.

## Steps

1. **Run build** — Execute the build command. Read the full output and list every error (file, line, message).
2. **Task list** — Catalog each error; mark pending.
3. **Fix one at a time** — Minimal fix per error; verify with typecheck or single-file build where possible. Mark done only when that error is gone.
4. **No full rebuild** until every item is resolved.
5. **Full confirmation** — Run the full build again; then run lint and typecheck as final gate.

## Checklist

- [ ] All build errors cataloged
- [ ] Each error fixed and verified
- [ ] Full build passes
- [ ] Lint and typecheck pass
