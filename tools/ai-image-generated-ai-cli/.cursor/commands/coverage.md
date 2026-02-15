---
description: Generate test coverage report and flag low-coverage areas.
---

# Coverage

## Overview

Generate a test coverage report and identify low-coverage areas. Use to assess test health and suggest tests for gaps. Run the project’s coverage command (e.g. `npm run test:coverage`, `make coverage`).

## Steps

1. **Run coverage** — Execute the coverage script.
2. **Locate artifacts** — Find the report (e.g. `.generated/coverage`, `coverage/`, project-defined path).
3. **Summarize** — Report overall percentages (lines, branches, functions, statements).
4. **Flag gaps** — Identify files below the project’s threshold (e.g. 70%).
5. **Suggest tests** — Recommend specific tests or scenarios for low-coverage areas.

## Checklist

- [ ] Coverage run completed
- [ ] Report path confirmed
- [ ] Summary with percentages provided
- [ ] Files below threshold flagged
- [ ] Suggestions for low-coverage areas provided
