<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/logger.utils" width="100%" />
</p>

<p align="center">
  <strong>Type-safe structured logging with correlation context for Node.js and Edge Runtime</strong>
</p>

<p align="center">
  Structured logging with correlation IDs and request context for Node and Edge.
</p>

**Features:** Type-safe · Node.js & Edge Runtime · Correlation ID / request-id · Tree-shakeable (subpath exports: `/client`, `/server`, `/shared`)

<p align="center">
  <a href="#the-choice">The Choice</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#plugin-architecture">Plugin Architecture</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## The Problem

You're debugging a production issue at 2 AM. Your logs look like this:

```
something happened
user did thing
error occurred
Processing...
Done
```

No timestamps. No context. No idea which service, which user, or what actually failed. You're mass `console.log`-ing across 47 files, deploying to staging, and praying.

**Sound familiar?**

Your logging is scattered, inconsistent, and useless when you need it most. You want structured logging, but Pino's API is different from Winston's, which is different from Bunyan's. Switching means rewriting every log call. Testing means log spam everywhere.

---

## The Choice

<p align="center">
  <em>"This is your last chance. After this, there is no turning back."</em>
</p>

<table>
<tr>
<td width="50%" valign="top">

### Blue Pill

*Stay in console.log wonderland*

```typescript
// Scattered across your codebase
console.log("user logged in");
console.log("error:", err);
console.log("DEBUG:", data);

// Testing? Good luck.
// Switching loggers? Rewrite everything.
// Production debugging? Pray.
```

</td>
<td width="50%" valign="top">

### Red Pill

*See how deep the rabbit hole goes*

```typescript
import { getLogger } from "@simpill/logger.utils";

const logger = getLogger("AuthService");

logger.info("User logged in", { userId: "123" });
logger.error("Authentication failed", { err });
logger.debug("Token payload", { data });

// Testing? LoggerFactory.enableMock();
// Switching to Pino? One line change.
// Production? Structured JSON with context.
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
npm install @simpill/logger.utils
```

---

## Quick Start

### Basic Usage

```typescript
import { getLogger } from "@simpill/logger.utils";

const logger = getLogger("MyService");

logger.info("Application started");
logger.warn("Cache miss", { key: "user:123" });
logger.debug("Processing request", { requestId: "abc" });
logger.error("Failed to connect", { host: "db.example.com" });
```

**Output:**
```
2024-01-15T10:30:00.000Z INFO [MyService] Application started
2024-01-15T10:30:00.001Z WARN [MyService] Cache miss {"key":"user:123"}
2024-01-15T10:30:00.002Z DEBUG [MyService] Processing request {"requestId":"abc"}
2024-01-15T10:30:00.003Z ERROR [MyService] Failed to connect {"host":"db.example.com"}
```

### Environment-Based Configuration

```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARN, ERROR
LOG_FORMAT=json         # json, pretty
LOG_TIMESTAMPS=true     # true, false
LOG_COLORS=true         # true, false (pretty format only)
```

### Swap to Pino in One Line

```typescript
import pino from "pino";
import { LoggerFactory } from "@simpill/logger.utils";
import { PinoLoggerAdapter } from "@simpill/logger.utils/adapters/pino";

// One line. Every logger in your app now uses Pino.
LoggerFactory.setAdapter(new PinoLoggerAdapter(pino({ level: "debug" })));
```

### Silent Tests

```typescript
beforeEach(() => LoggerFactory.enableMock());
afterEach(() => LoggerFactory.disableMock());

it("runs without log spam", () => {
  // Your tests are clean.
});
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Plugin Architecture** | Swap logger backends (Pino, Winston) without changing application code |
| **Type-Safe** | Full TypeScript support with strict types |
| **Dual Runtime** | Works in Node.js and Edge Runtime/browsers |
| **Structured Logging** | JSON-compatible output with metadata |
| **Multiple Formatters** | Simple, JSON, colored, and custom formats |
| **Mock Logger** | Silent tests with one line |
| **Zero Dependencies** | Default adapter has no external dependencies |
| **Environment Config** | Auto-configures from `LOG_LEVEL`, `LOG_FORMAT`, etc. |

---

## Plugin Architecture

The adapter pattern lets you swap both the **logging backend** and the **output format**.

### LoggerAdapter Interface

```typescript
interface LoggerAdapter {
  initialize(config: LoggerAdapterConfig): void;
  log(entry: LogEntry): void;
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter;
  flush?(): Promise<void>;
  destroy?(): Promise<void>;
}
```

### FormatterAdapter Interface

```typescript
interface FormatterAdapter {
  formatInfo(context: FormatterContext): FormattedOutput;
  formatWarn(context: FormatterContext): FormattedOutput;
  formatDebug(context: FormatterContext): FormattedOutput;
  formatError(context: FormatterContext): FormattedOutput;
}
```

### Built-in Adapters

| Adapter | Description | Dependencies |
|---------|-------------|--------------|
| `SimpleLoggerAdapter` | Default adapter using stdout/stderr | None |
| `PinoLoggerAdapter` | High-performance JSON logging | `pino` (peer) |
| `FileLoggerAdapter` | Disk logging with rotation (sync I/O; wrap with `BufferedLoggerAdapter` for high throughput) | None |
| `BufferedLoggerAdapter` | Batches log entries and flushes to an inner adapter; call `destroy()` on shutdown to stop the timer and flush | None |

### Built-in Formatters

| Formatter | Description |
|-----------|-------------|
| `SimpleFormatterAdapter` | Configurable text formatter |
| `ColoredFormatterAdapter` | Terminal-friendly with ANSI colors |
| `jsonFormatter` | JSON output |
| `minimalFormatter` | Level + message only |
| `verboseFormatter` | Full output including PID |

---

## Structured log schema (ECS / Pino compatible)

Each log entry has a fixed shape suitable for log shippers (Elastic, Datadog, etc.):

- **level** — `DEBUG` \| `INFO` \| `WARN` \| `ERROR`
- **message** — string
- **name** — logger name (e.g. service or class)
- **timestamp** — ISO string (optional)
- **metadata** — optional object (merged with correlation context on server)

JSON output follows a similar structure to Pino/ECS so you can pipe to the same pipelines. Use `LOG_FORMAT=json` in production for machine-readable logs.

---

## Client vs server (runtime parity)

| Feature | Server (`@simpill/logger.utils/server`) | Client (`@simpill/logger.utils/client`) |
|--------|----------------------------------------|----------------------------------------|
| Correlation context | Yes: `withLogContext`, `setLogContextProvider` | No: AsyncLocalStorage not available |
| File adapter / BufferedAdapter | Yes | No |
| `createClassLogger`, `getLogger` | Yes | Yes: `createEdgeLogger`, `getLogger` (if using main entry) |
| `logTable`, `logLLMEvent`, `logExecutorEvent` | Yes: server-only helpers | No |

Use the **client** entry in Edge Runtime or browser to avoid pulling Node-only code.

---

## Correlation context and AsyncLocalStorage (server)

Use request-scoped context so every log inside a request carries the same `requestId` / `traceId`:

```typescript
import { withLogContext, getLogger, setLogContextProvider } from "@simpill/logger.utils/server";

// In your framework middleware (e.g. Express/Fastify):
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] ?? crypto.randomUUID();
  withLogContext({ requestId }, () => next());
});

// Or provide context from AsyncLocalStorage yourself:
setLogContextProvider(() => ({ requestId: getRequestContext()?.requestId }));
const logger = getLogger("MyService");
logger.info("Handling request"); // metadata will include requestId if provider returns it
```

---

## Buffered adapter and shutdown

`BufferedLoggerAdapter` batches entries and flushes on an interval or when the buffer is full. It **never blocks** the caller; if the inner adapter is slow, the buffer may grow and on overflow (maxBufferSize) the oldest entries are flushed synchronously. There is no backpressure API; for very high throughput consider a bounded buffer and onFlushError handling. To avoid losing logs on exit:

- Call **`flushLogs()`** (or `adapter.flush()`) in a shutdown hook before process exit.
- Call **`destroy()`** on the adapter to stop the timer and perform a final flush. This is **required for cleanup** (clears the flush timer and flushes remaining entries); without it the timer may keep the process alive or drop buffered logs.

Configure buffer size and flush interval via `BufferedAdapterConfig`; larger buffers reduce I/O but increase memory and risk of losing logs on crash.

---

## Transports and custom backends

Besides the built-in **Pino** adapter, you can implement `LoggerAdapter` to wrap **Winston**, **Bunyan**, or any backend: implement `log(entry)`, `child(name, metadata)`, and optionally `flush`/`destroy`. Set it globally with `setLoggerAdapter(myAdapter)`. See [Creating Custom Components](#creating-custom-components).

---

## Redaction and PII

This package does not redact fields automatically. To avoid logging PII:

- Do not put secrets or raw PII in `message` or `metadata`.
- Redact in a custom formatter (e.g. replace `password`, `token` with `[REDACTED]`) or sanitize metadata before calling `logger.info(message, metadata)`.
- Use structured metadata only for non-sensitive identifiers (e.g. requestId, userId) when needed for tracing.

---

## JSON vs pretty: when to use which

- **JSON** (`LOG_FORMAT=json`): Use in production for log aggregation and querying; minimal overhead and consistent parsing.
- **Pretty**: Use in development for readability. Colored/formatted output is slower and not intended for high-throughput production.

---

## Sampling and rate limiting

There is no built-in sampling. To reduce log volume (e.g. DEBUG in production), either set `minLevel` to `INFO` or higher via `configureLoggerFactory`, or implement sampling in a custom adapter (e.g. log only 1 in N entries for a given level).

---

## Server-only helpers

From `@simpill/logger.utils/server`:

- **`logTable(logger, title, rows)`** — Log a table (array of objects) for debugging.
- **`logLLMEvent(logger, message, metadata?)`** — Log LLM-related events with consistent metadata.
- **`logExecutorEvent(logger, message, metadata?)`** — Log executor/tool events.

Use these for structured operational logs alongside your normal `logger.info`/`logger.error` calls.

---

## Creating Custom Components

### Custom Formatter

```typescript
import { FormatterAdapter, FormatterContext } from "@simpill/logger.utils";

class MyFormatter implements FormatterAdapter {
  formatInfo(ctx: FormatterContext): string {
    return `[${ctx.timestamp}] INFO ${ctx.loggerName}: ${ctx.message}`;
  }
  formatWarn(ctx: FormatterContext): string {
    return `[${ctx.timestamp}] WARN ${ctx.loggerName}: ${ctx.message}`;
  }
  formatDebug(ctx: FormatterContext): string {
    return `[${ctx.timestamp}] DEBUG ${ctx.loggerName}: ${ctx.message}`;
  }
  formatError(ctx: FormatterContext): string {
    return `[${ctx.timestamp}] ERROR ${ctx.loggerName}: ${ctx.message}`;
  }
}
```

### Custom Adapter

```typescript
import { LoggerAdapter, LogEntry, LogMetadata } from "@simpill/logger.utils";

class MyCustomAdapter implements LoggerAdapter {
  initialize(config: LoggerAdapterConfig): void {}

  log(entry: LogEntry): void {
    console.log(`[${entry.level}] ${entry.name}: ${entry.message}`);
  }

  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    return new MyCustomAdapter();
  }
}

LoggerFactory.setAdapter(new MyCustomAdapter());
```

### What we don't provide

- **ECS/Pino-style schema** — The **LoggerAdapter** contract is **debug/info/warn/error**(message, ...args). Structure (e.g. ECS fields, level, timestamp) is the adapter’s responsibility; implement it in your adapter or use one that matches your format.
- **Sampling / rate limiting** — No built-in sample rate or log throttling; implement in the adapter (e.g. drop or queue in adapter.info) if needed.
- **Redaction / PII** — No built-in redaction; sanitize in the adapter or before calling logger methods.
- **File / transport implementations** — Only the adapter interface; use **@simpill/adapters.utils** **consoleLoggerAdapter** or wire Pino/Winston/etc. via a custom adapter.

---

## API Reference

### LoggerFactory

```typescript
import { LoggerFactory, getLogger, configureLoggerFactory } from "@simpill/logger.utils";

configureLoggerFactory({ config: { minLevel: "INFO" } });
setLoggerAdapter(myAdapter);

const logger = getLogger("ServiceName");

enableLoggerMock();   // Silent mode
disableLoggerMock();  // Normal mode
clearLoggerCache();   // Clear cached loggers
await flushLogs();    // Flush buffered logs
await resetLoggerFactory();  // Reset to defaults
```

**Global state and testing:** The factory uses module-level state (`globalAdapter`, `globalConfig`, `isMockEnabled`, `isEnvConfigApplied`). For test isolation call `setLoggerAdapter(...)`, `enableLoggerMock()`, or `resetLoggerFactory()` between tests; there is no DI container—configure the factory explicitly.

**Logger cache:** `getLogger(name)` caches loggers by name (when called without `defaultMetadata`). The cache is size-bounded (LRU, max 1000 entries) with **no TTL**—entries stay until evicted by size or until `clearLoggerCache()` is called. Call `clearLoggerCache()` after reconfiguring the adapter if you need to avoid stale logger references.

**Per-logger level:** Filtering is global via `config.minLevel`. For per-logger or per-name level overrides, use a custom adapter that checks the logger name or metadata and filters entries before forwarding.

### Adapters and types

Adapters (file, pino, simple) use **LogEntry** and **LogMetadata** from shared types for typed entries and metadata. Implement custom adapters against the LoggerAdapter interface and use these types for structured streams.

### Logger Interface

```typescript
interface Logger {
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}
```

---

## Import Paths

```typescript
import { ... } from "@simpill/logger.utils";           // Everything
import { ... } from "@simpill/logger.utils/server";    // Node.js only
import { ... } from "@simpill/logger.utils/client";    // Edge/Browser
import { ... } from "@simpill/logger.utils/shared";    // Shared utilities
import { PinoLoggerAdapter } from "@simpill/logger.utils/adapters/pino";
```

**Tree-shaking:** The shared barrel re-exports many items (formatters, adapters, types). For smaller bundles, prefer subpath imports by concern (e.g. `@simpill/logger.utils/adapters/pino`, or import only the symbols you need from `@simpill/logger.utils/shared`).

---

## Environment Variables

| Variable | Values | Default |
|----------|--------|---------|
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARN`, `ERROR` | `DEBUG` |
| `LOG_FORMAT` | `json`, `pretty` | `pretty` |
| `LOG_TIMESTAMPS` | `true`, `false` | `true` |
| `LOG_COLORS` | `true`, `false` | `true` |

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

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).
- **Maintainers:** [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md).

---

## License

ISC
