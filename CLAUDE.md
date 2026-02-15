# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing utility packages under the `@simpill` namespace.

**Key Documentation:**
- [README.md](./README.md) - Monorepo overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - **Detailed guide for creating new packages**
- [AGENTS.md](./AGENTS.md) - Repository guidelines

## Packages

| Package | Path | Status |
|---------|------|--------|
| `@simpill/env.utils` | `utils/@simpill-env.utils/` | Stable |
| `@simpill/logger.utils` | `utils/@simpill-logger.utils/` | In Development |
| `@simpill/object.utils` | `utils/@simpill-object.utils/` | Stable |
| `@simpill/misc.utils` | `utils/@simpill-misc.utils/` | New |
| `@simpill/cache.utils` | `utils/@simpill-cache.utils/` | New |
| `@simpill/async.utils` | `utils/@simpill-async.utils/` | New |
| `@simpill/function.utils` | `utils/@simpill-function.utils/` | New |
| `@simpill/test.utils` | `utils/@simpill-test.utils/` | New |
| `@simpill/events.utils` | `utils/@simpill-events.utils/` | New |
| `@simpill/data.utils` | `utils/@simpill-data.utils/` | New |
| `@simpill/time.utils` | `utils/@simpill-time.utils/` | Stable |
| `@simpill/uuid.utils` | `utils/@simpill-uuid.utils/` | Stable |
| `@simpill/crypto.utils` | `utils/@simpill-crypto.utils/` | New |
| `@simpill/file.utils` | `utils/@simpill-file.utils/` | New |
| `@simpill/errors.utils` | `utils/@simpill-errors.utils/` | New |
| `@simpill/patterns.utils` | `utils/@simpill-patterns.utils/` | New |
| `@simpill/factories.utils` | `utils/@simpill-factories.utils/` | New |
| `@simpill/adapters.utils` | `utils/@simpill-adapters.utils/` | New |
| `@simpill/algorithms.utils` | `utils/@simpill-algorithms.utils/` | New |
| `@simpill/annotations.utils` | `utils/@simpill-annotations.utils/` | New |
| `@simpill/array.utils` | `utils/@simpill-array.utils/` | New |
| `@simpill/collections.utils` | `utils/@simpill-collections.utils/` | New |
| `@simpill/http.utils` | `utils/@simpill-http.utils/` | New |
| `@simpill/middleware.utils` | `utils/@simpill-middleware.utils/` | New |
| `@simpill/nextjs.utils` | `utils/@simpill-nextjs.utils/` | New |
| `@simpill/number.utils` | `utils/@simpill-number.utils/` | New |
| `@simpill/observability.utils` | `utils/@simpill-observability.utils/` | New |
| `@simpill/protocols.utils` | `utils/@simpill-protocols.utils/` | New |
| `@simpill/react.utils` | `utils/@simpill-react.utils/` | New |
| `@simpill/request-context.utils` | `utils/@simpill-request-context.utils/` | New |
| `@simpill/resilience.utils` | `utils/@simpill-resilience.utils/` | New |
| `@simpill/socket.utils` | `utils/@simpill-socket.utils/` | New |
| `@simpill/string.utils` | `utils/@simpill-string.utils/` | New |
| `@simpill/token-optimizer.utils` | `utils/@simpill-token-optimizer.utils/` | New |
| `@simpill/zod.utils` | `utils/@simpill-zod.utils/` | New |
| `@simpill/zustand.utils` | `utils/@simpill-zustand.utils/` | New |

## Quick Reference

### Development Commands

Run from any package directory:

```bash
npm run build          # Compile TypeScript
npm test               # Run tests
npm run test:coverage  # Tests with coverage
npm run check:fix      # Fix lint + format
npm run verify         # All pre-push checks
```

### Package Structure

Every package follows this structure:

```
{name}.utils/
├── src/
│   ├── client/        # Edge/browser (no fs)
│   ├── server/        # Node.js (full access)
│   └── shared/        # Runtime-agnostic
├── __tests__/         # Mirrors src/ structure
│   └── {runtime}/{unit,integration}/
├── scripts/           # check.sh, install-hooks.sh
├── package.json       # Subpath exports configured
├── tsconfig.json      # Strict mode
├── jest.config.js     # 80% coverage threshold
└── biome.json         # Linting/formatting
```

### Subpath Exports

All packages support tree-shakeable imports:

```typescript
import { ... } from "@simpill/env.utils";         // Everything
import { ... } from "@simpill/env.utils/client";  // Client only
import { ... } from "@simpill/env.utils/server";  // Server only
import { ... } from "@simpill/env.utils/shared";  // Shared utils
```

## Architecture Patterns

### Runtime Separation

- **client/**: No `fs` module, works in Edge Runtime, browsers, middleware
- **server/**: Full Node.js access, file system, `.env` loading
- **shared/**: Pure functions, no runtime-specific dependencies

### Key Design Decisions

- **Type Safety**: Strict TypeScript, type-safe getters with defaults
- **Singleton Pattern**: Managers use singleton for consistent state
- **Auto-bootstrapping**: Lazy initialization on first use
- **Minimal Dependencies**: Each package is self-contained

## Code Style

Enforced by Biome:
- 2-space indentation
- Double quotes
- Semicolons required
- 100 character line width
- ES5 trailing commas

## Testing

- Jest with ts-jest
- Tests in `__tests__/` mirroring `src/` structure
- Naming: `{feature}.unit.test.ts`, `{feature}.integration.test.ts`
- **80% coverage minimum** (branches, functions, lines, statements)

## Creating New Packages

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the complete guide including:
- Directory structure template
- Required configuration files
- Test organization
- CI/CD setup
- Checklist for new packages