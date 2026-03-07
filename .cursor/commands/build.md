---
description: Run production build and fix compilation errors. Follow the fixing workflow when resolving errors.
---

# Build Project

## Overview

Run the production build and fix any compilation errors. When fixing errors, follow the project's fixing workflow (see project rules).

**Context:** This repo is a monorepo. For a **single util package**, run from that package: `cd utils/@simpill-<name>.utils && npm run build`. For **all utils** from repo root: `make utils-build`. Sandbox apps live in the [simpill-sandbox](https://github.com/simpill/simpill-sandbox) repo; build there with `npm run build` (in that repo).

## Steps

1. **Run build**
   - In a package: `npm run build`. From root for all utils: `make utils-build`.
   - Read the complete output and capture every build error.

2. **Create task list**
   - Catalog every error: file path, line, short description.
   - Mark all items as pending.

3. **Fix issues systematically**
   - Fix one error at a time.
   - Read the file and understand the root cause.
   - Apply minimal fix; never use `any` or `@ts-ignore` as shortcuts.
   - Verify with: `npm run typecheck` (faster than full build).
   - Mark done only after the specific error is gone.

4. **Do not re-run full build** until all items are individually resolved.

5. **Full confirmation**
   - Run `npm run build` (in package) or `make utils-build`.
   - For utils: `dist/` is generated.

6. **Final gate:** `npm run lint && npm run typecheck` (in package).

## Checklist

- [ ] All build errors cataloged in task list
- [ ] Each error fixed and verified (typecheck)
- [ ] Full build passes (package or make target)
- [ ] Lint and typecheck pass
