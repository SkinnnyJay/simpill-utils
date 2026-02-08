<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/logger.utils" width="100%" />
</p>

<p align="center">
  <strong>Type-safe structured logging with a plugin architecture for Node.js and Edge Runtime</strong>
</p>

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

### 🔵 Blue Pill

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

### 🔴 Red Pill

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

### Built-in Formatters

| Formatter | Description |
|-----------|-------------|
| `SimpleFormatterAdapter` | Configurable text formatter |
| `ColoredFormatterAdapter` | Terminal-friendly with ANSI colors |
| `jsonFormatter` | JSON output |
| `minimalFormatter` | Level + message only |
| `verboseFormatter` | Full output including PID |

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

---

## API Reference

### LoggerFactory

```typescript
import { LoggerFactory, getLogger } from "@simpill/logger.utils";

LoggerFactory.configure({ config: { minLevel: "INFO" } });
LoggerFactory.setAdapter(myAdapter);

const logger = getLogger("ServiceName");

LoggerFactory.enableMock();   // Silent mode
LoggerFactory.disableMock();  // Normal mode
LoggerFactory.clearCache();   // Clear cached loggers
await LoggerFactory.flush();  // Flush buffered logs
await LoggerFactory.reset();  // Reset to defaults
```

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

---

## License

ISC
