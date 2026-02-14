# Package Template

This template provides step-by-step instructions and all configuration files needed to create a new `@simpill` package.

## Quick Start

```bash
# Replace {name} with your package name (e.g., cache, http, logger)
export PKG_NAME="{name}"

# Run the setup commands
./scripts/create-package.sh $PKG_NAME
```

Or follow the manual steps below.

---

## Table of Contents

1. [Step 1: Create Directory Structure](#step-1-create-directory-structure)
2. [Step 2: Create Configuration Files](#step-2-create-configuration-files)
3. [Step 3: Create Source Files](#step-3-create-source-files)
4. [Step 4: Create Scripts](#step-4-create-scripts)
5. [Step 5: Create Documentation](#step-5-create-documentation)
6. [Step 6: Create CI/CD Workflows](#step-6-create-cicd-workflows)
7. [Step 7: Initialize and Verify](#step-7-initialize-and-verify)
8. [Checklist](#checklist)

---

## Step 1: Create Directory Structure

```bash
# Replace {name} with your package name
PKG_NAME="{name}"

# Create all directories
mkdir -p ${PKG_NAME}.utils/{src/{client,server,shared},__tests__/{client,server,shared}/{unit,integration},scripts,examples/{basic,advanced,client,server}}
```

Final structure:

```
{name}.utils/
├── __tests__/
│   ├── client/
│   │   ├── unit/
│   │   └── integration/
│   ├── server/
│   │   ├── unit/
│   │   └── integration/
│   └── shared/
│       └── unit/
├── examples/
│   ├── basic/
│   ├── advanced/
│   ├── client/
│   └── server/
├── scripts/
├── src/
│   ├── client/
│   ├── server/
│   └── shared/
```

---

## Step 2: Create Configuration Files

### package.json

```json
{
  "name": "@simpill/{name}.utils",
  "version": "1.0.0",
  "description": "Brief description of the package",
  "repository": {
    "type": "git",
    "url": "https://github.com/SkinnnyJay/@simpill.git",
    "directory": "{name}.utils"
  },
  "bugs": {
    "url": "https://github.com/SkinnnyJay/@simpill/issues"
  },
  "homepage": "https://github.com/SkinnnyJay/@simpill/tree/main/{name}.utils#readme",
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
  "author": "@SkinnnyJay",
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
  },
  "dependencies": {}
}
```

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
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
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
# Cursor Ignore Configuration

# Version Control
.git/
.svn/
.hg/

# Build outputs
build/
dist/
out/
target/
*.exe
*.dll
*.so
*.dylib

# Dependencies
node_modules/
vendor/
.venv/
venv/
env/
__pycache__/
*.pyc

# IDE and Editor files
.idea/
.vscode/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Logs and databases
*.log
logs/
log/
*.sqlite
*.db

# Cache and temporary files
.cache/
.temp/
tmp/
temp/
.cursor-history/

# Test coverage
coverage/
.coverage
htmlcov/

# Environment and secrets
.env
.env.local
*.pem
*.key
secrets/

# Documentation build
docs/_build/
site/

# Package files
*.tgz
*.tar.gz
*.zip
*.rar

# Lock files (use package-lock.json)
yarn.lock
pnpm-lock.yaml
```

### .npmignore

```npmignore
# Source files
src/
__tests__/

# Configuration
tsconfig.json
.gitignore
.npmignore
biome.json
jest.config.js
Makefile
scripts/

# IDE
.vscode/
.idea/
*.swp
*.swo
.cursorrules
.cursorignore

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment files
.env
.env.local
.env.*.local

# Testing
coverage/
.nyc_output/

# Documentation (keep README.md)
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
examples/
```

---

## Step 3: Create Source Files

### src/index.ts (Main Entry Point)

```typescript
/**
 * {Name} Utilities
 *
 * Brief description of what this package provides.
 *
 * Import paths:
 * - `@simpill/{name}.utils` - All exports (this file)
 * - `@simpill/{name}.utils/client` - Edge-only utilities
 * - `@simpill/{name}.utils/server` - Node.js-only utilities
 * - `@simpill/{name}.utils/shared` - Shared utilities
 */

// Client/Edge-compatible functions (no fs dependency)
export * from "./client";

// Server/Node.js utilities (requires fs)
export * from "./server";

// Shared utilities
export * from "./shared";
```

### src/client/index.ts

```typescript
/**
 * Client/Edge Runtime Utilities
 *
 * Lightweight, file-system-free utilities for edge environments.
 * These functions work in Edge Runtime, browsers, and middleware.
 */

// Export client-specific implementations
// export { functionName } from "./implementation-file";
```

### src/server/index.ts

```typescript
/**
 * Server/Node.js Utilities
 *
 * Full-featured utilities with Node.js API access.
 * These utilities require Node.js and should not be used in edge/client environments.
 */

// Export server-specific implementations
// export { ClassName, functionName } from "./implementation-file";
```

### src/shared/index.ts

```typescript
/**
 * Shared utilities for {name} handling.
 * These are used by both client (edge) and server (node) implementations.
 */

// Export shared constants, types, and pure functions
// export { CONSTANT_NAME, TypeName, helperFunction } from "./helpers";
```

### src/shared/constants.ts (Example)

```typescript
/**
 * Shared constants for {name}.utils
 */

/** Log prefix for console messages */
export const LOG_PREFIX = "[{name}.utils]";

/** Default configuration values */
export const DEFAULTS = {
  timeout: 5000,
  retries: 3,
} as const;
```

### src/shared/errors.ts (Example)

```typescript
/**
 * Error classes for {name}.utils
 */

/** Base error class for all {name}.utils errors */
export class {Name}Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "{Name}Error";
  }
}

/** Error thrown when validation fails */
export class {Name}ValidationError extends {Name}Error {
  constructor(message: string) {
    super(message);
    this.name = "{Name}ValidationError";
  }
}
```

---

## Step 4: Create Scripts

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

if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "Not a git repository. Skipping hook installation."
  exit 0
fi

mkdir -p "$HOOKS_DIR"

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [ -x "$REPO_ROOT/{name}.utils/scripts/pre-push.sh" ]; then
  "$REPO_ROOT/{name}.utils/scripts/pre-push.sh"
fi
EOF

chmod +x "$HOOKS_DIR/pre-push"

echo "Git hooks installed."
```

### scripts/pre-push.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
./scripts/check.sh
```

**Make scripts executable:**

```bash
chmod +x ${PKG_NAME}.utils/scripts/*.sh
```

---

## Step 5: Create Documentation

### README.md

```markdown
# @simpill/{name}.utils

Brief description of what this package does.

## Installation

\`\`\`bash
npm install @simpill/{name}.utils
\`\`\`

## Usage

### Basic Usage

\`\`\`typescript
import { functionName } from "@simpill/{name}.utils";

// Example usage
const result = functionName();
\`\`\`

### Client/Edge Runtime

\`\`\`typescript
import { clientFunction } from "@simpill/{name}.utils/client";

// Works in Edge Runtime, browsers, middleware
\`\`\`

### Server/Node.js

\`\`\`typescript
import { ServerClass } from "@simpill/{name}.utils/server";

// Full Node.js features
\`\`\`

## API Reference

### Client Exports

| Export | Description |
|--------|-------------|
| `functionName` | Brief description |

### Server Exports

| Export | Description |
|--------|-------------|
| `ClassName` | Brief description |

### Shared Exports

| Export | Description |
|--------|-------------|
| `helperFunction` | Brief description |

## License

ISC
```

### AGENTS.md

```markdown
# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains TypeScript sources. Runtime-specific modules live in `src/client/` (Edge) and `src/server/` (Node), with shared helpers in `src/shared/`. Public exports are consolidated in `src/index.ts` and per-runtime `index.ts` files.
- `__tests__/` mirrors the runtime split (`client`, `server`, `shared`) with `unit/` and `integration/` suites.
- `examples/` holds usage samples; `dist/` is the compiled output generated by `tsc`.
- `scripts/` contains repo automation (checks and git hooks). `coverage/` is generated by Jest.

## Build, Test, and Development Commands
- `npm run build`: compile TypeScript to `dist/`.
- `npm test`: run Jest once; `npm run test:watch` for watch mode.
- `npm run test:coverage`: generate coverage reports in `coverage/`.
- `npm run lint`, `npm run format`, `npm run check`: Biome linting/formatting.
- `npm run verify`: full pre-push suite (format check, lint, typecheck, tests, build).
- `npm run prepare`: install the git pre-push hook via `scripts/install-hooks.sh`.

## Coding Style & Naming Conventions
- TypeScript is `strict` with a Node 16+ target; avoid widening types unnecessarily.
- Biome enforces 2-space indentation, double quotes, semicolons, trailing commas, and 100-char lines.
- File names use `kebab-case` with runtime hints when needed (e.g., `{name}.edge.ts`, `parse-helpers.ts`).
- Use `camelCase` for variables/functions and `PascalCase` for types/classes. Keep exports wired through the relevant `index.ts` barrel files.

## Testing Guidelines
- Jest + `ts-jest` with tests under `__tests__/`.
- Naming convention: `*.unit.test.ts` and `*.integration.test.ts`.
- Add tests in the matching domain folder (`client`, `server`, `shared`).
- Maintain 80%+ coverage across branches, functions, lines, and statements.

## Commit & Pull Request Guidelines
- Use Conventional Commits like `feat:`, `fix:`, or `chore:` with optional scopes (e.g., `feat(server): add parser`).
- PRs should summarize intent, list test commands run, and note any API changes.
- Update `README.md` or `examples/` when public behavior or exports change.
```

### CLAUDE.md

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this package.

## Package Overview

`@simpill/{name}.utils` provides [brief description].

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry point, re-exports all |
| `src/client/index.ts` | Edge/browser exports |
| `src/server/index.ts` | Node.js exports |
| `src/shared/index.ts` | Shared utilities |

## Quick Commands

\`\`\`bash
npm run build          # Compile TypeScript
npm test               # Run tests
npm run test:coverage  # Tests with coverage
npm run check:fix      # Fix lint + format
npm run verify         # All pre-push checks
\`\`\`

## Architecture

- **client/**: No `fs` module, works in Edge Runtime
- **server/**: Full Node.js access
- **shared/**: Pure functions, no runtime dependencies

## Testing

Tests mirror the `src/` structure:
- `__tests__/client/unit/` - Client unit tests
- `__tests__/server/unit/` - Server unit tests
- `__tests__/shared/unit/` - Shared unit tests

Naming: `{feature}.unit.test.ts` or `{feature}.integration.test.ts`
```

---

## Step 6: Create CI/CD Workflows

### .github/workflows/{name}-utils-ci.yml

```yaml
name: {name}.utils CI

on:
  push:
    branches:
      - main
      - develop
    paths:
      - "{name}.utils/**"
      - ".github/workflows/{name}-utils-ci.yml"
  pull_request:
    branches:
      - main
      - develop
    paths:
      - "{name}.utils/**"
      - ".github/workflows/{name}-utils-ci.yml"

defaults:
  run:
    working-directory: {name}.utils

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: {name}.utils/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Check formatting
        run: npm run format:check

      - name: Lint
        run: npm run lint

  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ["18", "20", "22"]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
          cache-dependency-path: {name}.utils/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: {name}.utils/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          directory: {name}.utils/coverage
          flags: {name}-utils
          fail_ci_if_error: false
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: {name}.utils/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Verify dist output
        run: |
          test -f dist/index.js
          test -f dist/index.d.ts
          test -f dist/client/index.js
          test -f dist/client/index.d.ts
          test -f dist/server/index.js
          test -f dist/server/index.d.ts
          test -f dist/shared/index.js
          test -f dist/shared/index.d.ts

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: {name}.utils/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit
```

---

## Step 7: Initialize and Verify

```bash
cd ${PKG_NAME}.utils

# Install dependencies
npm install

# Run all checks
npm run verify
```

---

## Checklist

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

### Tests

- [ ] Unit tests for all public APIs
- [ ] Integration tests where applicable
- [ ] 80%+ coverage achieved
- [ ] All tests passing

### CI/CD

- [ ] `.github/workflows/{name}-utils-ci.yml`

### Final Verification

- [ ] `npm run verify` passes all checks
- [ ] `npm run build` produces valid output
- [ ] Package can be imported correctly
- [ ] Subpath exports work as expected

---

## Example Test File

### \_\_tests\_\_/shared/unit/helpers.unit.test.ts

```typescript
/**
 * @file Helpers Unit Tests
 * @description Tests for shared helper functions
 */

describe("helperFunction", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe("basic functionality", () => {
    it("should return expected result for valid input", () => {
      // Arrange
      const input = "test";

      // Act
      const result = helperFunction(input);

      // Assert
      expect(result).toBe("expected");
    });

    it("should handle edge case: empty string", () => {
      expect(helperFunction("")).toBe("");
    });

    it("should throw when input is invalid", () => {
      expect(() => {
        helperFunction(null as any);
      }).toThrow(ValidationError);
    });
  });
});
```

---

## Notes

- Replace all `{name}` placeholders with your actual package name (lowercase)
- Replace all `{Name}` placeholders with PascalCase version for class names
- Add package-specific dependencies to `package.json` as needed
- Update keywords in `package.json` to match your package's purpose
- The `examples/` directory structure is optional but recommended
