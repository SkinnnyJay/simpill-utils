# Contributing to @simpill

This guide explains how to create new packages in the `@simpill` monorepo.

## Table of Contents

- [Package Naming](#package-naming)
- [Directory Structure](#directory-structure)
- [Required Files](#required-files)
- [Configuration Files](#configuration-files)
- [Scripts](#scripts)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)
- [Subpath Exports](#subpath-exports)
- [CI/CD Setup](#cicd-setup)
- [Checklist](#checklist)

---

## Package Naming

All packages follow the naming convention: `@simpill/{name}.utils`

Examples:
- `@simpill/env.utils`
- `@simpill/logger.utils`
- `@simpill/cache.utils`
- `@simpill/http.utils`

The directory name matches the package suffix (e.g., `env.utils/` for `@simpill/env.utils`).

---

## Directory Structure

Every package MUST follow this structure:

```
{name}.utils/
├── __tests__/                  # Test files (mirrors src/ structure)
│   ├── client/                 # Client-side tests (if applicable)
│   │   ├── unit/
│   │   │   └── *.unit.test.ts
│   │   └── integration/
│   │       └── *.integration.test.ts
│   ├── server/                 # Server-side tests (if applicable)
│   │   ├── unit/
│   │   │   └── *.unit.test.ts
│   │   └── integration/
│   │       └── *.integration.test.ts
│   └── shared/                 # Shared utility tests
│       └── unit/
│           └── *.unit.test.ts
├── scripts/                    # Shell scripts
│   ├── check.sh                # Pre-push verification script
│   ├── install-hooks.sh        # Git hooks installer
│   └── pre-push.sh             # Pre-push hook
├── src/                        # Source code
│   ├── client/                 # Client/Edge runtime code (no fs access)
│   │   └── index.ts            # Client exports
│   ├── server/                 # Server/Node.js code (full access)
│   │   └── index.ts            # Server exports
│   ├── shared/                 # Shared utilities (runtime-agnostic)
│   │   └── index.ts            # Shared exports
│   ├── index.ts                # Main entry point (re-exports all)
│   └── *.d.ts                  # Type declarations (if needed)
├── dist/                       # Build output (git-ignored)
├── coverage/                   # Coverage reports (git-ignored)
├── node_modules/               # Dependencies (git-ignored)
├── .cursorrules                # Cursor IDE rules (optional)
├── .gitignore                  # Git ignore patterns
├── .npmignore                  # npm publish ignore patterns
├── AGENTS.md                   # AI agent guidelines for this package
├── biome.json                  # Biome linter/formatter config
├── CLAUDE.md                   # Claude-specific instructions
├── jest.config.js              # Jest test configuration
├── Makefile                    # Make commands (optional)
├── package.json                # Package manifest
├── README.md                   # Package documentation
└── tsconfig.json               # TypeScript configuration
```

### Source Code Organization

The `src/` directory uses a **runtime-based** organization:

| Directory | Purpose | Can use `fs`? | Example |
|-----------|---------|---------------|---------|
| `client/` | Edge Runtime, browser, middleware | ❌ No | Edge env helpers |
| `server/` | Node.js, API routes, server components | ✅ Yes | File-based config |
| `shared/` | Runtime-agnostic utilities | ❌ No | Parse helpers, types |

### Test File Naming

Test files MUST follow this naming convention:

```
{feature}.unit.test.ts       # Unit tests (isolated, mocked dependencies)
{feature}.integration.test.ts # Integration tests (real dependencies)
```

---

## Required Files

### package.json

```json
{
  "name": "@simpill/{name}.utils",
  "version": "1.0.0",
  "description": "Brief description of the package",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.js",
      "require": "./dist/client/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js",
      "require": "./dist/server/index.js"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "import": "./dist/shared/index.js",
      "require": "./dist/shared/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "verify": "./scripts/check.sh",
    "prepare": "./scripts/install-hooks.sh"
  },
  "keywords": [
    "typescript",
    "type-safe",
    "{relevant-keywords}"
  ],
  "author": "",
  "license": "ISC",
  "sideEffects": false,
  "devDependencies": {
    "@biomejs/biome": "^2.3.11",
    "@types/jest": "^30.0.0",
    "@types/node": "^20.11.0",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.6",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "typescript": ">=4.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

- **`sideEffects": false`** — Tells bundlers (webpack, Rollup, Vite) the package is side-effect free so unused exports can be tree-shaken. Use this for pure utility packages.

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node", "jest"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

### jest.config.js

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

Use **coverageThreshold.global** with `branches`, `functions`, `lines`, and `statements` (80% default). Single-line `coverageThreshold: { global: { ... } }` and multi-line with nested `global: { ... }` are both acceptable; keep existing packages consistent with the template above.

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.11/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "includes": ["**", "!**/node_modules", "!**/dist", "!**/*.d.ts.map", "!**/*.js.map"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100,
    "formatWithErrors": false
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noBannedTypes": "error",
        "noUselessTypeConstraint": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noParameterAssign": "error",
        "useConst": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noArrayIndexKey": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "trailingCommas": "es5",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "overrides": [
    {
      "includes": ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Coverage
coverage/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Lock files (use package-lock.json)
yarn.lock
pnpm-lock.yaml
```

### .npmignore

```npmignore
# Source files (dist is published)
src/
__tests__/

# Config files
.cursorrules
.gitignore
biome.json
jest.config.js
tsconfig.json
Makefile
scripts/

# Coverage
coverage/

# Documentation (keep README.md)
AGENTS.md
CLAUDE.md
```

---

## Scripts

### scripts/check.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running pre-push checks for {name}.utils"
echo "--------------------------------------"

echo "[1/5] Checking format..."
npm run format:check
echo "Format check passed."

echo "[2/5] Running linter..."
npm run lint
echo "Lint check passed."

echo "[3/5] Running type check..."
npx tsc --noEmit
echo "Type check passed."

echo "[4/5] Running tests..."
npm test
echo "Tests passed."

echo "[5/5] Verifying build..."
npm run build
echo "Build completed."

echo "--------------------------------------"
echo "All checks passed."
```

### scripts/install-hooks.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$PACKAGE_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Not a git repository or .git/hooks not found. Skipping hook installation."
  exit 0
fi

PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"

cat > "$PRE_PUSH_HOOK" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Run checks for each package that has changes
for pkg_dir in env.utils logger.utils; do
  if [ -d "$pkg_dir" ] && [ -f "$pkg_dir/scripts/check.sh" ]; then
    if git diff --cached --name-only | grep -q "^$pkg_dir/"; then
      echo "Running checks for $pkg_dir..."
      (cd "$pkg_dir" && ./scripts/check.sh)
    fi
  fi
done
EOF

chmod +x "$PRE_PUSH_HOOK"
echo "Git hooks installed successfully."
```

### scripts/pre-push.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
./scripts/check.sh
```

Make all scripts executable:

```bash
chmod +x scripts/*.sh
```

---

## Testing Requirements

### Coverage Thresholds

All packages MUST maintain **80% minimum coverage** across:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Test Organization

```
__tests__/
├── client/
│   ├── unit/                   # Fast, isolated tests
│   │   └── feature.unit.test.ts
│   └── integration/            # Tests with real dependencies
│       └── feature.integration.test.ts
├── server/
│   ├── unit/
│   └── integration/
└── shared/
    └── unit/
```

### Async tests and timeouts

For **async-heavy tests** (e.g. `delay()`, retries, WebSockets, timers):

- Use **short delays** in unit tests (e.g. 1–50 ms) so CI stays fast.
- If a test needs more time, set **`jest.setTimeout(ms)`** at the top of the `describe` block or in `jest.config.js` (`testTimeout`). A common default is 5–10 seconds for unit tests; increase only for integration tests that hit real I/O.
- Prefer **fake timers** (`jest.useFakeTimers()`) where possible to avoid real waits.

### Test File Template

```typescript
/**
 * @file {Feature} Unit Tests
 * @description Tests for {feature description}
 */

describe("{FeatureName}", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe("{methodName}", () => {
    it("should {expected behavior}", () => {
      // Arrange
      // Act
      // Assert
    });

    it("should handle edge case: {description}", () => {
      // Test edge cases
    });

    it("should throw when {error condition}", () => {
      expect(() => {
        // Action that should throw
      }).toThrow(ExpectedError);
    });
  });
});
```

---

## Code Style

### Enforced by Biome

- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **Trailing commas**: ES5 style
- **Line endings**: LF

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `EnvManager` |
| Functions | camelCase | `getEnvString` |
| Variables | camelCase | `envValue` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_TIMEOUT` |
| Types/Interfaces | PascalCase | `EnvManagerOptions` |
| Files | dot-separated lowercase | `env.utils.ts` |
| Test files | `{name}.unit.test.ts` | `env-manager.unit.test.ts` |

### File Size Limits

- **Maximum 400 lines** per file
- Split large modules into smaller, focused files

---

## Subpath Exports

All packages SHOULD support subpath exports for tree-shaking:

```typescript
// Main export (everything)
import { EnvManager, getEdgeString } from "@simpill/env.utils";

// Client-only (no fs dependencies)
import { getEdgeString } from "@simpill/env.utils/client";

// Server-only (full Node.js features)
import { EnvManager } from "@simpill/env.utils/server";

// Shared utilities
import { parseBoolean } from "@simpill/env.utils/shared";
```

### Entry Point Structure

```typescript
// src/index.ts - Main entry, re-exports everything
export * from "./client";
export * from "./server";
export * from "./shared";

// src/client/index.ts - Client exports
export { getEdgeString, getEdgeNumber } from "./env.edge";

// src/server/index.ts - Server exports
export { EnvManager } from "./env.utils";

// src/shared/index.ts - Shared exports
export { parseBoolean, parseNumber } from "./parse-helpers";
```

---

## CI/CD Setup

Create GitHub Actions workflows in `.github/workflows/`:

### {name}-utils-ci.yml

```yaml
name: "{name}.utils CI"

on:
  push:
    branches: [main]
    paths:
      - "{name}.utils/**"
      - ".github/workflows/{name}-utils-ci.yml"
  pull_request:
    branches: [main]
    paths:
      - "{name}.utils/**"
      - ".github/workflows/{name}-utils-ci.yml"

defaults:
  run:
    working-directory: {name}.utils

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
          cache-dependency-path: "{name}.utils/package-lock.json"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          directory: {name}.utils/coverage
          flags: {name}-utils
```

---

## Checklist

Use this checklist when creating a new package:

### Initial Setup

- [ ] Create package directory: `{name}.utils/`
- [ ] Create `src/` directory structure (`client/`, `server/`, `shared/`)
- [ ] Create `__tests__/` directory structure (mirrors `src/`)
- [ ] Create `scripts/` directory with `check.sh`, `install-hooks.sh`, `pre-push.sh`
- [ ] Make scripts executable: `chmod +x scripts/*.sh`

### Configuration Files

- [ ] `package.json` with correct name, exports, and scripts
- [ ] `tsconfig.json` with strict mode
- [ ] `jest.config.js` with coverage thresholds
- [ ] `biome.json` with standard rules
- [ ] `.gitignore`
- [ ] `.npmignore`

### Documentation

- [ ] `README.md` with installation, usage, and API reference
- [ ] `AGENTS.md` with package-specific AI guidelines
- [ ] `CLAUDE.md` with Claude-specific instructions

### Source Code

- [ ] `src/index.ts` main entry point
- [ ] `src/client/index.ts` client exports
- [ ] `src/server/index.ts` server exports
- [ ] `src/shared/index.ts` shared exports
- [ ] Implementation files in appropriate directories
- [ ] No unbounded caches by default (document or use bounded cache/LRU)
- [ ] Timers and event listeners cleaned up in public APIs (e.g. destroy/close)

### Tests

- [ ] Unit tests for all public APIs
- [ ] Integration tests where applicable
- [ ] 80%+ coverage achieved
- [ ] All tests passing

### CI/CD

- [ ] `.github/workflows/{name}-utils-ci.yml`
- [ ] `.github/workflows/{name}-utils-release.yml` (optional)

### Final Verification

- [ ] `npm run verify` passes all checks
- [ ] `npm run build` produces valid output
- [ ] Package can be imported correctly
- [ ] Subpath exports work as expected

---

## Example: Creating a New Package

```bash
# 1. Create directory structure
mkdir -p cache.utils/{src/{client,server,shared},__tests__/{client,server,shared}/{unit,integration},scripts}

# 2. Copy template files from env.utils
cp env.utils/package.json cache.utils/
cp env.utils/tsconfig.json cache.utils/
cp env.utils/jest.config.js cache.utils/
cp env.utils/biome.json cache.utils/
cp env.utils/.gitignore cache.utils/
cp env.utils/.npmignore cache.utils/
cp env.utils/scripts/*.sh cache.utils/scripts/

# 3. Update package.json
# - Change name to "@simpill/cache.utils"
# - Update description
# - Update keywords
# - Adjust dependencies

# 4. Create entry points
touch cache.utils/src/index.ts
touch cache.utils/src/client/index.ts
touch cache.utils/src/server/index.ts
touch cache.utils/src/shared/index.ts

# 5. Make scripts executable
chmod +x cache.utils/scripts/*.sh

# 6. Install dependencies
cd cache.utils && npm install

# 7. Start developing!
```
