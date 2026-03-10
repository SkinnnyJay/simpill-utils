# Examples

Runnable examples for `@simpill/logger.utils` organized by use case.

> **New to this package?** Start with [`01-basic-usage.ts`](./01-basic-usage.ts)

## Quick Start

```bash
# From the logger.utils directory
npm install
npx ts-node examples/01-basic-usage.ts
```

## Examples

| Example | What You'll Learn |
|---------|-------------------|
| [01-basic-usage.ts](./01-basic-usage.ts) | Creating loggers, log levels, metadata, logger caching |
| [02-custom-adapters.ts](./02-custom-adapters.ts) | JSON/colored/minimal formatters, custom configurations |
| [03-testing-patterns.ts](./03-testing-patterns.ts) | Mock mode, capturing logs, reset patterns, cache management |

## Quick Reference

### Basic Logging

```typescript
import { getLogger, LoggerFactory } from "@simpill/logger.utils";

// Create a logger
const logger = getLogger("MyService");

// Log at different levels
logger.info("Application started");
logger.warn("Cache miss", { key: "user:123" });
logger.debug("Processing", { requestId: "abc" });
logger.error("Failed", { error: "Connection refused" });

// Logger with default metadata
const requestLogger = getLogger("Handler", { requestId: "req-123" });
requestLogger.info("Processing"); // Includes requestId in every log
```

### Logger Caching

```typescript
// Loggers without metadata are cached
const logger1 = getLogger("MyService");
const logger2 = getLogger("MyService");
console.log(logger1 === logger2); // true

// Loggers with metadata are always fresh
const loggerA = getLogger("MyService", { v: "1.0" });
const loggerB = getLogger("MyService", { v: "2.0" });
console.log(loggerA === loggerB); // false

// Cache management
LoggerFactory.getCacheSize();  // Get cached logger count
LoggerFactory.clearCache();    // Clear the cache
await LoggerFactory.reset();   // Full reset (also clears cache)
```

### Custom Formatters

```typescript
import {
  LoggerFactory,
  SimpleLoggerAdapter,
  jsonFormatter,
  coloredFormatter,
  minimalFormatter,
} from "@simpill/logger.utils";

// JSON output
LoggerFactory.setAdapter(new SimpleLoggerAdapter("App", undefined, jsonFormatter));

// Colored terminal output
LoggerFactory.setAdapter(new SimpleLoggerAdapter("App", undefined, coloredFormatter));

// Minimal output (level + message only)
LoggerFactory.setAdapter(new SimpleLoggerAdapter("App", undefined, minimalFormatter));
```

### Testing

```typescript
import { LoggerFactory } from "@simpill/logger.utils";

describe("MyService", () => {
  beforeEach(() => {
    LoggerFactory.enableMock(); // Suppress log output
  });

  afterEach(async () => {
    await LoggerFactory.reset(); // Clean up between tests
  });

  it("should work", () => {
    // Your test - no log noise
  });
});
```

---

See the [main README](../README.md) for full API documentation.
