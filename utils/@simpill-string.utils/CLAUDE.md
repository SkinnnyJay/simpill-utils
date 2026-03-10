# CLAUDE.md

This file provides guidance for working on `@simpill/string.utils`.

## Commands

```bash
cd utils/string.utils

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint and format
npm run check:fix

# Full verification
npm run verify
```

## Structure

- `src/shared/` contains runtime-agnostic string utilities.
- `src/client/` and `src/server/` re-export shared helpers.
- `__tests__/shared/unit/` holds unit tests for shared utilities.
