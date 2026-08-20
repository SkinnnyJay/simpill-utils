## Summary

<!-- One or two sentences: what changes and why. -->

## Issue

<!-- What was wrong. Cite the exact file:line the defect lives at. -->

- **Package:** `@simpill/<name>.utils` (or: root tooling)
- **Defect:**
- **Evidence:** `path/to/file.ts:LINE`

## Failing input / current behaviour

<!-- Concrete reproduction. If this is a defect fix, show the input that misbehaves today. -->

```
```

## Change

<!-- What the fix does, and why this representation is simpler than what it replaces. -->

## Public API impact

- [ ] No public API change
- [ ] Additive only (new exports; nothing removed or renamed)
- [ ] Behavioural change to an exported function (no type change) — **minor bump + CHANGELOG**
- [ ] Breaking type-level change — **major bump + CHANGELOG**

<!-- If any box other than the first is ticked, state the migration for consumers. -->

## Validation

- [ ] `npm run check:fix` (lint + format) clean
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] New test added that **fails without this change**

<!-- Name the test that pins the fix. -->

## Regression risk

<!-- What could break, and what was checked. "None" is acceptable if justified. -->

## Related

<!-- Prerequisite or follow-up PRs, if any. -->
