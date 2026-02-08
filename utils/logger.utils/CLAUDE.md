# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing utility packages under the `@simpill` namespace:
- `env.utils` - Type-safe environment variable utilities
- `logger.utils` - Structured logging with correlation context support

## Common Development Commands

### Build
```bash
cd logger.utils && npm run build
```

### Testing
```bash
# Run all tests
cd logger.utils && npm test

# Run tests in watch mode
cd logger.utils && npm run test:watch

# Run tests with coverage
cd logger.utils && npm run test:coverage

# Run a single test file
cd logger.utils && npx jest __tests__/server/unit/logger.unit.test.ts

# Run tests matching a pattern
cd logger.utils && npx jest --testNamePattern="createClassLogger"
```

### Code Quality
```bash
# Lint code
cd logger.utils && npm run lint

# Fix lint issues automatically
cd logger.utils && npm run lint:fix

# Format code
cd logger.utils && npm run format

# Check format without modifying
cd logger.utils && npm run format:check

# Run all checks (lint + format)
cd logger.utils && npm run check

# Fix all issues (lint + format)
cd logger.utils && npm run check:fix

# Type checking only
cd logger.utils && npx tsc --noEmit

# Run all verification checks (format, lint, type-check, test, build)
cd logger.utils && npm run verify
```

## Architecture Overview

### logger.utils Package

The package provides a three-layer architecture for structured logging:

1. **Server Runtime (`src/server/`)**: Full Node.js logging with correlation context
   - `LoggerSingleton` class: Singleton with context-aware logging
   - `createClassLogger`: Factory for class-specific loggers
   - `withCorrelationContext`: AsyncLocalStorage-based distributed tracing
   - Automatic correlation ID propagation across async boundaries

2. **Client/Edge Runtime (`src/client/`)**: Lightweight edge-compatible utilities
   - `createEdgeLogger`: Factory for edge-compatible loggers
   - Individual function exports (`edgeLogInfo`, `edgeLogWarn`, etc.)
   - No Node.js dependencies - works in Edge Runtime and browsers

3. **Shared Utilities (`src/shared/`)**: Common types and formatters
   - Constants: `LOG_LEVEL`, `LOGGER_CONTEXT`, `METADATA_KEYS`
   - Types: `Logger`, `LogMetadata`, `LogEntry`, `CorrelationContext`
   - Formatters: `simpleFormatter`, `jsonFormatter`, `timestampFormatter`

### Export Paths

```typescript
// Main export - includes everything
import { createClassLogger, createEdgeLogger } from '@simpill/logger.utils';

// Server-only (Node.js with correlation context)
import { createClassLogger, withCorrelationContext } from '@simpill/logger.utils/server';

// Client-only (Edge Runtime compatible)
import { createEdgeLogger, edgeLogInfo } from '@simpill/logger.utils/client';

// Shared types and formatters
import { LOG_LEVEL, simpleFormatter } from '@simpill/logger.utils/shared';
```

## Test Structure

Tests are organized by runtime and type:
- `__tests__/client/unit/` - Edge runtime unit tests
- `__tests__/server/unit/` - Node.js runtime unit tests
- `__tests__/server/integration/` - Integration tests with correlation context
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
cd logger.utils && ./scripts/check.sh
```
