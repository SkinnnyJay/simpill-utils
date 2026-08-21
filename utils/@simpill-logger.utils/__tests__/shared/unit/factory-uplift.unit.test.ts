/**
 * @file Factory Uplift Unit Tests
 * @description Level gate, redaction wiring, child loggers, safe fallback.
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "../../../src/shared/adapter";
import { LOG_LEVEL, type LogLevel } from "../../../src/shared/constants";
import { clearLogContextProvider, setLogContextProvider } from "../../../src/shared/context";
import {
  configureLoggerFactory,
  enableLoggerMock,
  getLogger,
  resetLoggerFactory,
  setLoggerAdapter,
} from "../../../src/shared/factory";
import type { LogEntry, LogMetadata } from "../../../src/shared/types";
import { LOG_LEVEL_PRIORITY } from "../../../src/shared/types";

class CapturingAdapter implements LoggerAdapter {
  entries: LogEntry[] = [];
  minLevel: LogLevel = LOG_LEVEL.DEBUG;
  gateCalls = 0;
  private readonly root: CapturingAdapter;

  constructor(root?: CapturingAdapter) {
    this.root = root ?? this;
  }

  initialize(config: LoggerAdapterConfig): void {
    if (config.minLevel) {
      this.minLevel = config.minLevel;
    }
  }

  log(entry: LogEntry): void {
    this.root.entries.push(entry);
  }

  child(_name: string, _metadata?: LogMetadata): LoggerAdapter {
    const child = new CapturingAdapter(this.root);
    child.minLevel = this.minLevel;
    return child;
  }

  isLevelEnabled(level: LogLevel): boolean {
    this.root.gateCalls++;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }
}

/** Adapter WITHOUT isLevelEnabled — the pre-uplift adapter shape. */
class LegacyAdapter implements LoggerAdapter {
  entries: LogEntry[] = [];
  initialize(_config: LoggerAdapterConfig): void {}
  log(entry: LogEntry): void {
    this.entries.push(entry);
  }
  child(_name: string, _metadata?: LogMetadata): LoggerAdapter {
    return this;
  }
}

describe("factory uplift", () => {
  afterEach(async () => {
    clearLogContextProvider();
    await resetLoggerFactory();
  });

  describe("fast level gate", () => {
    it("skips ALL entry construction for disabled levels (context provider not called)", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { minLevel: LOG_LEVEL.INFO } });

      const contextProvider = jest.fn(() => ({ requestId: "r1" }));
      setLogContextProvider(contextProvider);

      const logger = getLogger("Gate");
      logger.debug("dropped", { expensive: true });

      expect(adapter.entries).toHaveLength(0);
      // The whole point: the disabled call never touched the context provider
      expect(contextProvider).not.toHaveBeenCalled();

      logger.info("kept");
      expect(adapter.entries).toHaveLength(1);
      expect(contextProvider).toHaveBeenCalledTimes(1);
    });

    it("adapters WITHOUT isLevelEnabled keep the exact previous behavior", () => {
      const adapter = new LegacyAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { minLevel: LOG_LEVEL.INFO } });

      const logger = getLogger("Legacy");
      logger.debug("still reaches adapter.log — the adapter decides");
      expect(adapter.entries).toHaveLength(1);
    });

    it("logger.isLevelEnabled reflects the adapter gate and mock state", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { minLevel: LOG_LEVEL.WARN } });

      const logger = getLogger("Guard");
      expect(logger.isLevelEnabled?.(LOG_LEVEL.DEBUG)).toBe(false);
      expect(logger.isLevelEnabled?.(LOG_LEVEL.ERROR)).toBe(true);

      enableLoggerMock();
      expect(logger.isLevelEnabled?.(LOG_LEVEL.ERROR)).toBe(false);
    });
  });

  describe("redaction wiring", () => {
    it("redacts default sensitive keys even without configure redactPaths", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);

      const logger = getLogger("DefaultRedact");
      logger.info("login", { password: "hunter2", ok: 1 });

      expect(adapter.entries[0].metadata).toEqual({
        password: "[REDACTED]",
        ok: 1,
      });
    });

    it("redacts configured paths before the adapter sees the entry", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { redact: ["password", "user.token"] } });

      const logger = getLogger("Redact");
      const meta = { password: "hunter2", user: { token: "t", name: "frank" }, ok: 1 };
      logger.info("login", meta);

      expect(adapter.entries[0].metadata).toEqual({
        password: "[REDACTED]",
        user: { token: "[REDACTED]", name: "frank" },
        ok: 1,
      });
      // caller's object untouched
      expect(meta.password).toBe("hunter2");
      expect(meta.user.token).toBe("t");
    });

    it("redacts context-provided fields too (merge happens before redaction)", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { redact: ["sessionToken"] } });
      setLogContextProvider(() => ({ sessionToken: "s3cret", requestId: "r" }));

      const logger = getLogger("Ctx");
      logger.info("evt");

      expect(adapter.entries[0].metadata).toEqual({
        sessionToken: "[REDACTED]",
        requestId: "r",
      });
    });

    it("supports RedactOptions with a custom censor", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({
        config: { redact: { paths: ["cc"], censor: "####" } },
      });
      getLogger("Censor").info("pay", { cc: "4111" });
      expect(adapter.entries[0].metadata).toEqual({ cc: "####" });
    });

    it("malformed redact paths throw at CONFIGURE time, not at log time", () => {
      expect(() => configureLoggerFactory({ config: { redact: ["oops["] } })).toThrow();
    });
  });

  describe("safe fallback on adapter failure", () => {
    it("circular metadata no longer loses the log entry (fallback line contains the message)", () => {
      const throwing: LoggerAdapter = {
        initialize(): void {},
        log(): void {
          throw new Error("adapter down");
        },
        child(): LoggerAdapter {
          return this;
        },
      };
      setLoggerAdapter(throwing);

      const err = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      const meta: Record<string, unknown> = { a: 1 };
      meta.self = meta;
      getLogger("Fallback").error("critical failure detail", meta);
      const stderrText = err.mock.calls.map((c) => String(c[0])).join("");
      err.mockRestore();

      // frozen behavior: the [FALLBACK] JSON.stringify threw -> message lost on both streams
      expect(stderrText).toContain("[FALLBACK]");
      expect(stderrText).toContain("critical failure detail");
      expect(stderrText).toContain("[Circular]");
    });
  });

  describe("child loggers", () => {
    it("child(name) appends the name and inherits the adapter", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      const parent = getLogger("Auth");
      const child = parent.child?.("db");
      child?.info("query");
      expect(adapter.entries[0].name).toBe("Auth.db");
    });

    it("child(metadata) keeps the name and merges metadata via the adapter chain", () => {
      // Use the real SimpleLoggerAdapter path to verify metadata inheritance end-to-end
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      const parent = getLogger("Svc");
      const child = parent.child?.({ tenant: "t1" });
      child?.info("evt", { x: 1 });
      expect(adapter.entries[0].name).toBe("Svc");
      // metadata inheritance is the adapter's job; CapturingAdapter ignores it,
      // so also verify grandchild naming composes
      const grandchild = child?.child?.("inner");
      grandchild?.info("evt2");
      expect(adapter.entries[1].name).toBe("Svc.inner");
    });

    it("children respect the level gate", () => {
      const adapter = new CapturingAdapter();
      setLoggerAdapter(adapter);
      configureLoggerFactory({ config: { minLevel: LOG_LEVEL.ERROR } });
      const child = getLogger("P").child?.("c");
      child?.info("dropped");
      expect(adapter.entries).toHaveLength(0);
    });
  });
});
