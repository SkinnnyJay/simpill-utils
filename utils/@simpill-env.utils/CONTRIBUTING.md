# Contributing to @simpill/env.utils

Thank you for your interest in contributing to `@simpill/env.utils`. This guide covers how to set up your development environment, run tests, and submit changes.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Adding New Features](#adding-new-features)

---

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/simpill.git
cd simpill/env.utils

# Install dependencies
npm install

# Verify setup
npm run verify
```

---

## Project Structure

```
env.utils/
├── src/
│   ├── client/                 # Edge Runtime utilities (no fs access)
│   │   ├── env.edge.ts         # Edge environment helpers
│   │   └── index.ts            # Client exports
│   ├── server/                 # Node.js utilities (full access)
│   │   ├── env.utils.ts        # EnvManager class
│   │   └── index.ts            # Server exports
│   ├── shared/                 # Runtime-agnostic utilities
│   │   ├── parse-helpers.ts    # Type parsing functions
│   │   └── index.ts            # Shared exports
│   ├── index.ts                # Main entry (re-exports all)
│   └── process-env.d.ts        # Type declarations
├── __tests__/
│   ├── client/
│   │   └── unit/               # Client unit tests
│   ├── server/
│   │   ├── unit/               # Server unit tests
│   │   └── integration/        # Server integration tests
│   └── shared/
│       └── unit/               # Shared utility tests
├── scripts/
│   ├── check.sh                # Pre-push verification
│   ├── install-hooks.sh        # Git hooks setup
│   └── pre-push.sh             # Pre-push hook
└── dist/                       # Build output (git-ignored)
```

### Runtime Separation

| Directory | Purpose | File System Access |
|-----------|---------|-------------------|
| `src/client/` | Edge Runtime, middleware, browser | No |
| `src/server/` | Node.js, API routes, server components | Yes |
| `src/shared/` | Pure utilities used by both | No |

---

## Development Workflow

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check for linting issues |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code |
| `npm run format:check` | Check formatting |
| `npm run check` | Run lint + format check |
| `npm run check:fix` | Fix lint + format issues |
| `npm run verify` | Run all pre-push checks |

### Typical Workflow

```bash
# 1. Make your changes
# 2. Run tests in watch mode while developing
npm run test:watch

# 3. Before committing, run all checks
npm run verify

# 4. Commit your changes
git add .
git commit -m "Add feature description"
```

---

## Testing

### Test Organization

Tests mirror the `src/` structure:

```
__tests__/
├── client/
│   └── unit/
│       ├── edge-helpers.unit.test.ts
│       └── get-edge-env.unit.test.ts
├── server/
│   ├── unit/
│   │   ├── env-manager.unit.test.ts
│   │   └── env.unit.test.ts
│   └── integration/
│       └── env-manager.integration.test.ts
└── shared/
    └── unit/
        └── parse-helpers.unit.test.ts
```

### Test Naming Convention

- **Unit tests**: `{feature}.unit.test.ts` - Isolated tests with mocked dependencies
- **Integration tests**: `{feature}.integration.test.ts` - Tests with real dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest __tests__/server/unit/env-manager.unit.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="getString"

# Run with coverage
npm run test:coverage
```

### Coverage Requirements

All contributions must maintain **80% minimum coverage**:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Check coverage with:

```bash
npm run test:coverage
```

### Writing Tests

```typescript
/**
 * @file EnvManager Unit Tests
 */

describe("EnvManager", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save and reset environment
    originalEnv = { ...process.env };
    process.env = {};
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe("getString", () => {
    it("should return environment variable value", () => {
      process.env.TEST_VAR = "test-value";
      
      const result = envManager.getString("TEST_VAR");
      
      expect(result).toBe("test-value");
    });

    it("should return default when variable is not set", () => {
      const result = envManager.getString("MISSING_VAR", "default");
      
      expect(result).toBe("default");
    });
  });
});
```

---

## Code Style

### Enforced by Biome

- **Indentation**: 2 spaces
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **Line width**: 100 characters
- **Trailing commas**: ES5 style

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `EnvManager` |
| Functions | camelCase | `getEdgeString` |
| Variables | camelCase | `envValue` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_ENV_PATHS` |
| Types/Interfaces | PascalCase | `EnvManagerOptions` |
| Private members | Prefix with `#` or `_` | `#bootstrapped` |

### File Naming

- Source files: `{name}.{purpose}.ts` (e.g., `env.utils.ts`, `env.edge.ts`)
- Test files: `{name}.unit.test.ts` or `{name}.integration.test.ts`

### Documentation

- Add JSDoc comments for all public APIs
- Include `@param`, `@returns`, and `@example` tags

```typescript
/**
 * Get a string environment variable.
 *
 * @param key - The environment variable name
 * @param defaultValue - Value to return if variable is not set
 * @returns The environment variable value or default
 *
 * @example
 * ```typescript
 * const apiUrl = envManager.getString("API_URL", "http://localhost:3000");
 * ```
 */
getString(key: string, defaultValue = ""): string {
  return process.env[key] ?? defaultValue;
}
```

---

## Submitting Changes

### Before Submitting

1. **Run all checks**:
   ```bash
   npm run verify
   ```

2. **Ensure tests pass** with adequate coverage

3. **Update documentation** if adding/changing public APIs

4. **Add/update examples** in README.md if applicable

### Commit Messages

Use short, imperative messages:

```
Add getEdgeBoolean helper for edge runtime
Fix number parsing for negative values
Update README with new API examples
```

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include a clear description of changes
- List any breaking changes
- Reference related issues

**PR Template:**

```markdown
## Summary
Brief description of changes

## Changes
- Added X
- Fixed Y
- Updated Z

## Testing
- [ ] All tests pass
- [ ] Coverage maintained at 80%+
- [ ] Manual testing performed

## Breaking Changes
None / List any breaking changes
```

---

## Adding New Features

### Adding a New Environment Helper

1. **Determine the runtime**:
   - Edge-compatible? → `src/client/`
   - Node.js only? → `src/server/`
   - Pure utility? → `src/shared/`

2. **Implement the feature**:

   ```typescript
   // src/client/env.edge.ts
   
   /**
    * Get a JSON-parsed environment variable.
    *
    * @param key - Environment variable name
    * @param defaultValue - Default value if not set or invalid JSON
    * @returns Parsed JSON value or default
    */
   export function getEdgeJson<T>(key: string, defaultValue: T): T {
     const value = process.env[key];
     if (value === undefined) return defaultValue;
     
     try {
       return JSON.parse(value) as T;
     } catch {
       return defaultValue;
     }
   }
   ```

3. **Export from index**:

   ```typescript
   // src/client/index.ts
   export { getEdgeJson } from "./env.edge";
   ```

4. **Add tests**:

   ```typescript
   // __tests__/client/unit/edge-helpers.unit.test.ts
   
   describe("getEdgeJson", () => {
     it("should parse valid JSON", () => {
       process.env.CONFIG = '{"port": 3000}';
       
       const result = getEdgeJson("CONFIG", {});
       
       expect(result).toEqual({ port: 3000 });
     });
     
     it("should return default for invalid JSON", () => {
       process.env.CONFIG = "not-json";
       
       const result = getEdgeJson("CONFIG", { port: 8080 });
       
       expect(result).toEqual({ port: 8080 });
     });
   });
   ```

5. **Update README.md** with usage example

6. **Run verification**:
   ```bash
   npm run verify
   ```

### Adding Support for New Types

When adding new type parsers to `shared/parse-helpers.ts`:

1. Add the parser function
2. Export from `shared/index.ts`
3. Use in both `client/` and `server/` modules
4. Add comprehensive tests for edge cases

---

## Questions?

If you have questions about contributing, please open an issue for discussion.
