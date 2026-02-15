# Examples

Runnable examples for `@simpill/env.utils` organized by use case.

> **New to this package?** Start with [`basic/01-getting-started.ts`](./basic/01-getting-started.ts)

## Quick Start

```bash
# From the env.utils directory
npm install
npx ts-node examples/basic/01-getting-started.ts
```

## Categories

### [Basic](./basic/) — Start Here

Fundamental patterns for reading environment variables with type safety.

| Example | What You'll Learn |
|---------|-------------------|
| [01-getting-started.ts](./basic/01-getting-started.ts) | Bootstrap, read strings/numbers/booleans, check existence |
| [02-type-safe-defaults.ts](./basic/02-type-safe-defaults.ts) | Why defaults matter, building config objects |
| [03-boolean-parsing.ts](./basic/03-boolean-parsing.ts) | Accepted values: `"true"`, `"1"`, `"false"`, `"0"` |
| [04-number-parsing.ts](./basic/04-number-parsing.ts) | Integer parsing, validation patterns |

### [Server](./server/) — Node.js Runtime

Full-featured environment management with `.env` file support.

| Example | What You'll Learn |
|---------|-------------------|
| [01-env-manager-basics.ts](./server/01-env-manager-basics.ts) | Singleton pattern, reading values, environment detection |
| [02-env-class-wrapper.ts](./server/02-env-class-wrapper.ts) | Dependency injection, testable services |
| [03-process-env-extension.ts](./server/03-process-env-extension.ts) | Add type-safe methods to `process.env` |
| [04-custom-env-paths.ts](./server/04-custom-env-paths.ts) | Load from custom paths, monorepo patterns |

### [Client](./client/) — Edge & Browser Runtime

Lightweight utilities for environments without file system access.

| Example | What You'll Learn |
|---------|-------------------|
| [01-edge-runtime-basics.ts](./client/01-edge-runtime-basics.ts) | Edge-safe getters, when to use client vs server |
| [02-nextjs-middleware.ts](./client/02-nextjs-middleware.ts) | Middleware config, feature flags, auth patterns |
| [03-browser-usage.ts](./client/03-browser-usage.ts) | Public env vars, React patterns, security considerations |

### [Advanced](./advanced/) — Production Patterns

Complex configuration strategies for real-world applications.

| Example | What You'll Learn |
|---------|-------------------|
| [01-overrides.ts](./advanced/01-overrides.ts) | Runtime overrides, testing with controlled values |
| [02-multiple-env-files.ts](./advanced/02-multiple-env-files.ts) | Layered configs, environment-specific files, CI/CD |
| [03-testing-patterns.ts](./advanced/03-testing-patterns.ts) | Reset between tests, mocking, snapshot testing |
| [04-configuration-patterns.ts](./advanced/04-configuration-patterns.ts) | Typed config objects, validation, feature flags |
| [05-dynamic-mode.ts](./advanced/05-dynamic-mode.ts) | Dynamic mode, cache refresh, runtime env changes |

## Sample Environment Files

Copy these to get started:

```bash
cp examples/.env.example .env
```

| File | Purpose |
|------|---------|
| [.env.example](./.env.example) | Development defaults |
| [.env.production.example](./.env.production.example) | Production overrides |

## Quick Reference

### Server-Side (Node.js)

```typescript
import { EnvManager } from "@simpill/env.utils/server";

EnvManager.bootstrap();
const env = EnvManager.getInstance();

const port = env.getNumber("PORT", 3000);
const debug = env.getBoolean("DEBUG_MODE", false);
const apiUrl = env.getString("API_URL", "http://localhost");
```

### Client-Side (Edge/Browser)

```typescript
import { getEdgeString, getEdgeNumber, getEdgeBoolean } from "@simpill/env.utils/client";

const apiUrl = getEdgeString("API_URL", "https://api.example.com");
const timeout = getEdgeNumber("TIMEOUT_MS", 5000);
const debug = getEdgeBoolean("DEBUG_MODE", false);
```

### Shared Utilities

```typescript
import { parseBooleanEnvValue, NODE_ENV } from "@simpill/env.utils/shared";

const isEnabled = parseBooleanEnvValue("true", false); // true

if (process.env.NODE_ENV === NODE_ENV.PRODUCTION) {
  // Production-specific logic
}
```

---

See the [main README](../README.md) for full API documentation.
