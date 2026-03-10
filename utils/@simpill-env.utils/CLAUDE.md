# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing utility packages under the `@simpill` namespace:
- `env.utils` - Type-safe environment variable utilities with dual runtime support (Node.js and Edge Runtime)
- `logger.utils` - (Placeholder for future logger utilities)

## Common Development Commands

### Build
```bash
cd env.utils && npm run build
# Or using Make:
cd env.utils && make build
```

### Testing
```bash
# Run all tests
cd env.utils && npm test

# Run tests in watch mode
cd env.utils && npm run test:watch

# Run tests with coverage
cd env.utils && npm run test:coverage

# Run a single test file
cd env.utils && npx jest __tests__/client/unit/edge-helpers.unit.test.ts

# Run tests matching a pattern
cd env.utils && npx jest --testNamePattern="getEdgeString"
```

### Code Quality
```bash
# Lint code
cd env.utils && npm run lint

# Fix lint issues automatically
cd env.utils && npm run lint:fix

# Format code
cd env.utils && npm run format

# Check format without modifying
cd env.utils && npm run format:check

# Run all checks (lint + format)
cd env.utils && npm run check

# Fix all issues (lint + format)
cd env.utils && npm run check:fix

# Type checking only
cd env.utils && npx tsc --noEmit

# Run all verification checks (format, lint, type-check, test, build)
cd env.utils && npm run verify
# Or using Make:
cd env.utils && make verify
```

## Architecture Overview

### env.utils Package

The package provides a three-layer architecture for environment variable management:

1. **Server Runtime (`src/server/`)**: Full Node.js environment management
   - `EnvManager` class: Singleton with `.env` file support and lazy initialization
   - `Env` wrapper class: Convenient interface around `EnvManager`
   - `extendProcessEnvPrototype`: Adds helper methods directly to process.env
   - Requires file system access (not available in Edge Runtime)

2. **Client/Edge Runtime (`src/client/`)**: Lightweight edge-compatible utilities
   - Individual function exports (`getEdgeString`, `getEdgeNumber`, `getEdgeBoolean`)
   - No file system dependencies - reads directly from `process.env`
   - Optimized for minimal bundle size in edge environments

3. **Shared Utilities (`src/shared/`)**: Common parsing logic
   - `parseNumberValue` and `parseBooleanValue` helpers
   - Used by both server and client implementations

### Export Paths

```typescript
// Main export - includes everything
import { EnvManager, getEdgeString } from '@simpill/env.utils';

// Server-only (Node.js with .env file support)
import { EnvManager } from '@simpill/env.utils/server';
import { EnvManager } from '@simpill/env.utils/node'; // Alias for server

// Client-only (Edge Runtime compatible)
import { getEdgeString } from '@simpill/env.utils/client';
import { getEdgeString } from '@simpill/env.utils/edge'; // Alias for client

// Shared parsing utilities
import { parseNumberValue } from '@simpill/env.utils/shared';
```

## Test Structure

Tests are organized by runtime and type:
- `__tests__/client/unit/` - Edge runtime unit tests
- `__tests__/server/unit/` - Node.js runtime unit tests
- `__tests__/server/integration/` - Integration tests with actual .env files
- `__tests__/shared/unit/` - Shared utility tests

## Code Quality Rules

From `.cursorrules`:
- **File size limit**: No file should exceed 400 lines
- **Formatting**: Biome with 2-space indentation, double quotes, semicolons required
- **Line width**: 100 characters maximum
- **Test coverage**: Maintain above 80%

## Pre-push Verification

A pre-push hook runs `scripts/check.sh` which performs:
1. Format check
2. Lint check
3. Type check
4. Test suite
5. Build verification

To run manually:
```bash
cd env.utils && ./scripts/check.sh
```