<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/env.utils" width="100%" />
</p>

<p align="center">
  <strong>Type-safe environment variable utilities for Node.js and Edge Runtime</strong>
</p>

<p align="center">
  Get type-safe environment variables for Node and Edge without runtime surprises.
</p>

**Features:** Type-safe · Node.js & Edge Runtime · Lightweight · Tree-shakeable (subpath exports: `/client`, `/server`, `/shared`)

<p align="center">
  <a href="#the-choice">The Choice</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#encryption">Encryption</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## The Problem

Your `.env` file has 47 variables. Your code looks like this:

```typescript
const port = process.env.PORT || 3000;
const timeout = process.env.TIMEOUT || "5000";
const debug = process.env.DEBUG === "true";
const maxRetries = parseInt(process.env.MAX_RETRIES || "3", 10);
const enableCache = process.env.ENABLE_CACHE !== "false";
```

**What could go wrong?**

- `port` is a string, not a number. Your comparison `port > 1024` just broke.
- `timeout` is `"5000"` (string), not `5000` (number). Math is fun.
- `debug` is `false` when `DEBUG=TRUE` because JavaScript.
- `maxRetries` is `NaN` when someone sets `MAX_RETRIES=three`. No error. Just silent failure.
- `enableCache` is `true` when `ENABLE_CACHE` is literally anything except `"false"`.

Now multiply this across 200 files. Add Edge Runtime where you can't read `.env` files. Sprinkle in some encrypted secrets. Deploy to production at 5 PM on Friday.

---

## The Choice

<p align="center">
  <em>"This is your last chance. After this, there is no turning back."</em>
</p>

<table>
<tr>
<td width="50%" valign="top">

### 🔵 Blue Pill

*Keep trusting process.env*

```typescript
// Is this a number? A string? Who knows!
const port = process.env.PORT || 3000;

// "true", "TRUE", "1", "yes"... pick one?
const debug = process.env.DEBUG === "true";

// Silent NaN. Silent failure.
const timeout = parseInt(process.env.TIMEOUT, 10);

// Edge Runtime? Can't read .env files.
// Encrypted secrets? Good luck.
// Type safety? What's that?
```

</td>
<td width="50%" valign="top">

### 🔴 Red Pill

*See your environment clearly*

```typescript
import { Env } from "@simpill/env.utils";

// Actual number. Guaranteed.
const port = Env.getNumber("PORT", 3000);

// Handles "true", "TRUE", "1", "yes"
const debug = Env.getBoolean("DEBUG", false);

// Type-safe. Validated. Defaulted.
const timeout = Env.getNumber("TIMEOUT", 5000);

// Edge Runtime? We got you.
// Encrypted secrets? Built-in.
// Type safety? Always.
```

</td>
</tr>
</table>

<p align="center">
  <em>"I'm trying to free your mind, Neo. But I can only show you the door.<br/>You're the one that has to walk through it."</em>
</p>

---

## Installation

```bash
npm install @simpill/env.utils
```

---

## Quick Start

### Node.js (Full Features)

```typescript
import { Env } from "@simpill/env.utils";

// Optional: Load .env files with priority
Env.bootstrap({
  envPaths: [".env", ".env.local"],
  overload: true,
});

// Type-safe getters with defaults - no getInstance() needed!
const apiUrl = Env.getString("API_URL", "http://localhost:3000");
const port = Env.getNumber("PORT", 3000);
const debug = Env.getBoolean("DEBUG", false);

// Required variables (throws if missing)
const apiKey = Env.getRequired("API_KEY");
const dbPort = Env.getRequiredNumber("DB_PORT");

// With custom error messages
const secret = Env.getRequired("JWT_SECRET", "JWT_SECRET is required for authentication");

// Check existence
if (Env.has("API_KEY")) {
  // Variable is set
}

// Environment checks
if (Env.isProduction()) {
  // Production mode
}
```

> **Note:** You can also use `EnvManager.getInstance()` if you prefer the instance pattern:
> ```typescript
> const env = EnvManager.getInstance();
> const port = env.getNumber("PORT", 3000);
> ```

### Edge Runtime (Lightweight)

```typescript
import { getEdgeString, getEdgeNumber, getEdgeBoolean } from "@simpill/env.utils/client";

// No file system needed - reads from process.env
const apiKey = getEdgeString("API_KEY", "");
const maxRetries = getEdgeNumber("MAX_RETRIES", 3);
const enableCache = getEdgeBoolean("ENABLE_CACHE", true);
```

**Edge caveats:** In Next.js, Cloudflare Workers, or Vercel Edge, `process.env` is often inlined at build time. Use the client helpers (`getEdgeString`, etc.) and ensure required variables are listed in your framework config (e.g. Next.js `env` in `next.config.js`) so they are available. Server-only features (`.env` file loading, encryption) are not available on the client/edge entrypoint.

### Schema-style validation

For whole-env validation in one place, define a spec and resolve it with the existing getters (or use **zod** / **joi** for full schema validation):

```typescript
import { Env } from "@simpill/env.utils";

function loadConfig() {
  return {
    PORT: Env.getNumber("PORT", 3000),
    NODE_ENV: Env.getEnum("NODE_ENV", ["development", "production", "test"], "development"),
    API_KEY: Env.getRequired("API_KEY"),
  };
}
const config = loadConfig();
```

Shared types `EnvSpec` and `EnvSpecEntry` (`@simpill/env.utils/shared`) describe spec shapes; use `parseNumberEnvValueStrict` / `parseBooleanEnvValueStrict` for strict parsing without defaults.

### Strict parsing

Use **strict** parsers when you want missing or invalid values to throw instead of falling back to a default:

- `Env.getRequiredNumber("PORT")` — throws `MissingEnvError` if unset, `EnvParseError` if not a number
- `Env.getRequiredBoolean("DEBUG")` — throws if unset or not a valid boolean
- From `@simpill/env.utils/shared`: `parseNumberEnvValueStrict(key, rawValue)`, `parseBooleanEnvValueStrict(key, rawValue)`, `parseEnvEnumStrict(key, rawValue, allowed)`

### Enum validation

```typescript
const logLevel = Env.getEnum("LOG_LEVEL", ["debug", "info", "warn", "error"], "info");
const env = Env.getRequiredEnum("NODE_ENV", ["development", "production", "test"]);
// Optional: { caseInsensitive: true } for case-insensitive matching
```

### Array and object parsing

- **Arrays:** `Env.getArray("ALLOWED_HOSTS")` — comma-separated, trimmed; optional separator (default `","`). `Env.getArray("PORTS", [], ":")` for colon-separated.
- **JSON:** `Env.getJson("CONFIG")` and `Env.getRequiredJson("CONFIG")` — parse JSON; invalid JSON throws when required or no default.

### Boolean Parsing That Actually Works

```typescript
// All of these return true:
env.getBoolean("FLAG"); // when FLAG=true, TRUE, True, 1, yes, YES, Yes

// All of these return false:
env.getBoolean("FLAG"); // when FLAG=false, FALSE, False, 0, no, NO, No

// Invalid values return your default:
env.getBoolean("FLAG", false); // when FLAG=banana → false
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Type-Safe** | `getNumber()` returns a number, not a string. Always. |
| **Dual Runtime** | Works in Node.js and Edge Runtime/browsers |
| **Encryption Ready** | Built-in [dotenvx](https://dotenvx.com) encryption support |
| **Smart Defaults** | Sensible fallbacks when variables are missing |
| **Priority Loading** | Load multiple `.env` files with clear precedence |
| **Dynamic Mode** | Optionally read from `process.env` on each access |
| **Zero Config** | Works out of the box, customize when needed |

---

## Import Paths

```typescript
import { ... } from "@simpill/env.utils";         // Everything
import { ... } from "@simpill/env.utils/server";  // Node.js only (EnvManager)
import { ... } from "@simpill/env.utils/client";  // Edge Runtime (getEdge*)
import { ... } from "@simpill/env.utils/shared";  // Shared utilities
```

---

## Configuration

### Multiple .env Files

```typescript
import { Env } from "@simpill/env.utils";

Env.bootstrap({
  envPaths: [".env", ".env.local", ".env.development"],
  overload: true, // Later files override earlier ones
});
```

### Runtime Overrides

```typescript
Env.bootstrap({
  envPath: ".env",
  overrides: {
    API_URL: "http://test-server:8080",
    DEBUG: "true",
  },
});
```

### Priority Order

1. **Manual overrides** (highest)
2. **process.env**
3. **Later .env files** (when `overload: true`)
4. **Earlier .env files** (lowest)

### Caching

`EnvManager` stores parsed values in in-memory `envCache` and `rawCache` with **no max size or TTL**. For typical usage (bootstrap once, read many times) this is fine. For long-running processes that frequently call `refresh()` or create many manager instances, be aware the caches grow with the number of keys loaded.

### Variable expansion (interpolation)

This package does not expand `VAR_2=${VAR_1}` style references inside `.env` values. For that, use [dotenv-expand](https://github.com/motdotla/dotenv-expand) (or similar) before or alongside loading; load expanded env into `process.env` and then use `Env` getters as usual.

### Dynamic mode and when to use it

**Dynamic mode** (`EnvManager.getInstance({ dynamic: true })`) reads from `process.env` on every access and **bypasses the in-memory cache**—values are not cached. Use it when:

- You need to reflect env changes without restarting (e.g. long-running dev watchers).
- You are in a serverless/cold-start environment and already load env at startup; dynamic is optional and usually not required.

For typical long-running Node servers, the default (cached after bootstrap) is preferred. Call `Env.refresh()` to reload from disk when you need to pick up file changes without dynamic mode.

### Dynamic Mode

```typescript
import { EnvManager } from "@simpill/env.utils";

// For dynamic mode, use EnvManager directly with options
const env = EnvManager.getInstance({ dynamic: true });

// Now runtime changes are reflected
process.env.API_URL = "http://new-url.com";
console.log(env.getString("API_URL")); // "http://new-url.com"
```

---

## Encryption

Built-in support for [dotenvx](https://dotenvx.com) encrypted secrets.

### Setup

```bash
# Install dotenvx CLI
npm install -g @dotenvx/dotenvx

# Encrypt your .env file
dotenvx encrypt

# Set the private key in production
export DOTENV_PRIVATE_KEY="your-private-key"
```

### Usage

```typescript
import { Env } from "@simpill/env.utils";

// Check if encrypted
if (Env.isEncrypted("API_SECRET")) {
  // Get decrypted value
  const secret = Env.getDecrypted("API_SECRET");
}

// Check if decryption is available
if (Env.hasPrivateKey()) {
  // Private key is configured
}
```

**Encryption failure handling:** If a value is prefixed with `encrypted:` but decryption fails (missing key, wrong key, or corrupted value), `Env.getDecrypted("KEY")` throws `EnvDecryptError`. Guard with `Env.isEncrypted("KEY")` and `Env.hasPrivateKey()` and handle errors in startup or health checks:

```typescript
try {
  const secret = Env.getDecrypted("API_SECRET");
} catch (e) {
  if (e instanceof EnvDecryptError) {
    console.error("Decryption failed:", e.reason);
  }
  throw e;
}
```

---

## CI and required keys

To enforce required env keys in CI, run your app (or a small script) that calls `Env.getRequired("KEY")` for each required variable; the process will exit on first missing key. Alternatively use a dedicated tool (e.g. [dotenv-vault](https://www.dotenv.org/docs/ci) or framework-specific env checks) to validate presence before deploy.

### What we don't provide

- **Schema validation (Zod/Joi)** — No integration with Zod or Joi. Use type-safe getters (`getNumber`, `getBoolean`, etc.) and validate with a schema library separately if you need full schema validation.
- **Variable expansion** — No `VAR_2=${VAR_1}` interpolation inside `.env` values; use [dotenv-expand](https://github.com/motdotla/dotenv-expand) (or similar) before loading, then use Env getters on the expanded `process.env`.

---

## API Reference

### Env (Static Shorthand)

The `Env` class provides static methods for quick access without needing `getInstance()`:

```typescript
import { Env } from "@simpill/env.utils";

// Bootstrap (optional)
Env.bootstrap({ envPaths: [".env"], overload: true });

// Type-safe getters with defaults
Env.getString("KEY", "default");
Env.getNumber("KEY", 0);
Env.getBoolean("KEY", false);

// Required getters (throw MissingEnvError if not set)
Env.getRequired("KEY");           // string
Env.getRequiredString("KEY");     // string (alias)
Env.getRequiredNumber("KEY");     // number (throws if invalid)
Env.getRequiredBoolean("KEY");    // boolean (throws if invalid)

// With custom error messages
Env.getRequired("API_KEY", "API_KEY is required for authentication");
Env.getRequiredNumber("PORT", "PORT must be set for the server to start");

// Strict getters (aliases)
Env.getStringStrict("KEY");       // same as getRequired
Env.getNumberStrict("KEY");       // same as getRequiredNumber
Env.getBooleanStrict("KEY");      // same as getRequiredBoolean

// Utility methods
Env.has("KEY");
Env.getValue("KEY");              // string | undefined
Env.getValueOrDefault("KEY", "fallback");

// Environment checks
Env.isProduction();
Env.isDevelopment();
Env.isTest();
Env.getNodeEnv();

// Encryption
Env.isEncrypted("KEY");
Env.getDecrypted("KEY");
Env.hasPrivateKey();

// Cache management
Env.refresh();
Env.isDynamic();
Env.getCacheSize();
Env.reset();                      // Reset instance (for testing)
```

### EnvManager (Instance Pattern)

For more control, use `EnvManager` directly:

```typescript
import { EnvManager } from "@simpill/env.utils";

// Bootstrap
EnvManager.bootstrap({ envPaths: [".env"], overload: true });

// Get instance (with optional config)
const env = EnvManager.getInstance();
const dynamicEnv = EnvManager.getInstance({ dynamic: true });

// All the same methods as Env, but on the instance
env.getString("KEY", "default");
env.getNumber("KEY", 0);
env.getBoolean("KEY", false);
// ... etc
```

### Edge Runtime (Client)

```typescript
import {
  getEdgeString,
  getEdgeNumber,
  getEdgeBoolean,
  getEdgeEnv,
  hasEdgeEnv,
  isEdgeProd,
  isEdgeDev,
} from "@simpill/env.utils/client";

const apiKey = getEdgeString("API_KEY", "");
const port = getEdgeNumber("PORT", 3000);
const debug = getEdgeBoolean("DEBUG", false);

if (hasEdgeEnv("API_KEY")) { /* exists */ }
if (isEdgeProd()) { /* production */ }
```

### EnvManager Options

| Option | Type | Description |
|--------|------|-------------|
| `envPath` | `string` | Single .env file path |
| `envPaths` | `string[]` | Multiple .env file paths |
| `overload` | `boolean` | Later files override earlier ones |
| `overrides` | `Record<string, string>` | Manual overrides (highest priority) |
| `dynamic` | `boolean` | Read from process.env on each access |
| `privateKey` | `string` | Decryption key (overrides DOTENV_PRIVATE_KEY) |

---

## Examples

```bash
# Run any example
npx ts-node examples/basic/01-getting-started.ts
```

| Category | Description |
|----------|-------------|
| [`basic/`](./examples/basic/) | Getting started, type-safe defaults, parsing |
| [`server/`](./examples/server/) | EnvManager, custom paths, process.env extension |
| [`client/`](./examples/client/) | Edge Runtime, Next.js middleware, browser |
| [`advanced/`](./examples/advanced/) | Overrides, multiple files, testing patterns |

---

## Development

```bash
npm install          # Install dependencies
npm test             # Run tests
npm run test:coverage # Coverage report
npm run build        # Build
npm run verify       # All checks
```

## Documentation

- **Examples:** [examples/](./examples/) — see [Examples](#examples) section for run commands and table.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).
- **Maintainers:** [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md).

---

## License

ISC
