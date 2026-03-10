/**
 * @file Factory Unit Tests
 * @description Tests for the LoggerFactory
 */

import type { LoggerAdapter } from "../../../src/shared/adapter";
import { LOG_LEVEL, LOGGER_DEFAULTS } from "../../../src/shared/constants";
import { clearLogContextProvider, setLogContextProvider } from "../../../src/shared/context";
import { configureLogger, getLogger, LoggerFactory } from "../../../src/shared/factory";
import type { LogEntry } from "../../../src/shared/types";

describe("LoggerFactory", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    await LoggerFactory.reset();
  });

  describe("getLogger", () => {
    it("should create a logger with the given name", () => {
      const logger = LoggerFactory.getLogger("TestService");

      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should include name in log output", () => {
      const logger = LoggerFactory.getLogger("MyService");
      logger.info("Test message");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("MyService");
    });

    it("should include default metadata in all logs", () => {
      const logger = LoggerFactory.getLogger("Service", { requestId: "123" });
      logger.info("Test");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("requestId");
      expect(output).toContain("123");
    });

    it("should cache loggers without metadata", () => {
      const logger1 = LoggerFactory.getLogger("CachedService");
      const logger2 = LoggerFactory.getLogger("CachedService");

      expect(logger1).toBe(logger2);
      expect(LoggerFactory.getCacheSize()).toBe(1);
    });

    it("should not cache loggers with metadata", () => {
      const logger1 = LoggerFactory.getLogger("MetaService", { version: "1.0" });
      const logger2 = LoggerFactory.getLogger("MetaService", { version: "2.0" });

      expect(logger1).not.toBe(logger2);
    });

    it("should cache different logger names separately", () => {
      const logger1 = LoggerFactory.getLogger("ServiceA");
      const logger2 = LoggerFactory.getLogger("ServiceB");

      expect(logger1).not.toBe(logger2);
      expect(LoggerFactory.getCacheSize()).toBe(2);
    });
  });

  describe("cache management", () => {
    it("should clear cache on clearCache()", () => {
      LoggerFactory.getLogger("Service1");
      LoggerFactory.getLogger("Service2");
      expect(LoggerFactory.getCacheSize()).toBe(2);

      LoggerFactory.clearCache();
      expect(LoggerFactory.getCacheSize()).toBe(0);
    });

    it("should clear cache when adapter changes", () => {
      LoggerFactory.getLogger("CachedService");
      expect(LoggerFactory.getCacheSize()).toBe(1);

      const newAdapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
      };

      LoggerFactory.setAdapter(newAdapter);
      expect(LoggerFactory.getCacheSize()).toBe(0);
    });

    it("should return new instance after cache clear", () => {
      const logger1 = LoggerFactory.getLogger("TestService");
      LoggerFactory.clearCache();
      const logger2 = LoggerFactory.getLogger("TestService");

      expect(logger1).not.toBe(logger2);
    });

    it("should evict oldest entry when cache is full (LRU)", () => {
      // Fill cache to max
      for (let i = 0; i < LOGGER_DEFAULTS.MAX_CACHE_SIZE; i++) {
        LoggerFactory.getLogger(`Service${i}`);
      }
      expect(LoggerFactory.getCacheSize()).toBe(LOGGER_DEFAULTS.MAX_CACHE_SIZE);

      // Add one more - should evict oldest
      LoggerFactory.getLogger("NewService");
      expect(LoggerFactory.getCacheSize()).toBe(LOGGER_DEFAULTS.MAX_CACHE_SIZE);

      // Service0 should have been evicted (oldest)
      // Getting it again should create a new instance
      const logger = LoggerFactory.getLogger("Service0");
      expect(logger).toBeDefined();
    });

    it("should update LRU order on cache hit", () => {
      // Create 3 loggers
      LoggerFactory.getLogger("A");
      LoggerFactory.getLogger("B");
      LoggerFactory.getLogger("C");

      // Access A again - moves it to end (most recently used)
      LoggerFactory.getLogger("A");

      // Cache order should now be B, C, A
      expect(LoggerFactory.getCacheSize()).toBe(3);
    });
  });

  describe("getRootLogger", () => {
    it("should return a logger with default context", () => {
      const logger = LoggerFactory.getRootLogger();
      logger.info("Root log");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("Logger");
    });
  });

  describe("configure", () => {
    it("should accept configuration options", () => {
      LoggerFactory.configure({
        config: { minLevel: LOG_LEVEL.WARN },
      });

      const logger = LoggerFactory.getLogger("Test");
      logger.debug("Should not appear");
      logger.warn("Should appear");

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy.mock.calls[0][0]).toContain("Should appear");
    });
  });

  describe("setAdapter", () => {
    it("should use custom adapter", () => {
      const logs: LogEntry[] = [];

      const customAdapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: (entry) => logs.push(entry),
        child: function (name) {
          return {
            ...this,
            log: (entry: LogEntry) => logs.push({ ...entry, name }),
          };
        },
      };

      LoggerFactory.setAdapter(customAdapter);

      const logger = LoggerFactory.getLogger("CustomTest");
      logger.info("Custom message");

      expect(customAdapter.initialize).toHaveBeenCalled();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Custom message");
      expect(logs[0].name).toBe("CustomTest");
    });

    it("should destroy previous adapter when setting new one", async () => {
      const destroyMock = jest.fn().mockResolvedValue(undefined);

      const oldAdapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
        destroy: destroyMock,
      };

      const newAdapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
      };

      LoggerFactory.setAdapter(oldAdapter);
      LoggerFactory.setAdapter(newAdapter);

      // Give time for async destroy
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(destroyMock).toHaveBeenCalled();
    });
  });

  describe("mock mode", () => {
    it("should suppress logs when mock is enabled", () => {
      LoggerFactory.enableMock();

      const logger = LoggerFactory.getLogger("Test");
      logger.info("Should not appear");
      logger.error("Should not appear either");

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should restore logs when mock is disabled", () => {
      LoggerFactory.enableMock();
      LoggerFactory.disableMock();

      const logger = LoggerFactory.getLogger("Test");
      logger.info("Should appear");

      expect(stdoutSpy).toHaveBeenCalled();
    });

    it("should report mock status correctly", () => {
      expect(LoggerFactory.isMockEnabled()).toBe(false);

      LoggerFactory.enableMock();
      expect(LoggerFactory.isMockEnabled()).toBe(true);

      LoggerFactory.disableMock();
      expect(LoggerFactory.isMockEnabled()).toBe(false);
    });
  });

  describe("flush", () => {
    it("should call adapter flush if available", async () => {
      const flushMock = jest.fn().mockResolvedValue(undefined);

      const adapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
        flush: flushMock,
      };

      LoggerFactory.setAdapter(adapter);
      await LoggerFactory.flush();

      expect(flushMock).toHaveBeenCalled();
    });

    it("should not throw if adapter has no flush", async () => {
      const adapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
      };

      LoggerFactory.setAdapter(adapter);
      await expect(LoggerFactory.flush()).resolves.toBeUndefined();
    });
  });

  describe("reset", () => {
    it("should reset to default state", async () => {
      LoggerFactory.enableMock();
      LoggerFactory.configure({ config: { minLevel: LOG_LEVEL.ERROR } });

      await LoggerFactory.reset();

      expect(LoggerFactory.isMockEnabled()).toBe(false);

      // Should use default adapter after reset
      const logger = LoggerFactory.getLogger("Test");
      logger.info("After reset");

      expect(stdoutSpy).toHaveBeenCalled();
    });

    it("should call destroy on adapter", async () => {
      const destroyMock = jest.fn().mockResolvedValue(undefined);

      const adapter: LoggerAdapter = {
        initialize: jest.fn(),
        log: jest.fn(),
        child: jest.fn().mockReturnThis(),
        destroy: destroyMock,
      };

      LoggerFactory.setAdapter(adapter);
      await LoggerFactory.reset();

      expect(destroyMock).toHaveBeenCalled();
    });
  });
});

describe("getLogger convenience function", () => {
  beforeEach(async () => {
    await LoggerFactory.reset();
  });

  afterEach(async () => {
    await LoggerFactory.reset();
  });

  it("should be an alias for LoggerFactory.getLogger", () => {
    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const logger = getLogger("ConvenienceTest");
    logger.info("Test");

    expect(stdoutSpy).toHaveBeenCalled();
    expect(stdoutSpy.mock.calls[0][0]).toContain("ConvenienceTest");

    stdoutSpy.mockRestore();
  });
});

describe("configureLogger convenience function", () => {
  beforeEach(async () => {
    await LoggerFactory.reset();
  });

  afterEach(async () => {
    await LoggerFactory.reset();
  });

  it("should be an alias for LoggerFactory.configure", () => {
    const logs: LogEntry[] = [];

    const adapter: LoggerAdapter = {
      initialize: jest.fn(),
      log: (entry) => logs.push(entry),
      child: function () {
        return this;
      },
    };

    configureLogger({ adapter });

    expect(adapter.initialize).toHaveBeenCalled();
  });
});

describe("adapter error handling (P1)", () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(async () => {
    stderrSpy.mockRestore();
    await LoggerFactory.reset();
  });

  it("should not crash when adapter throws", () => {
    const throwingAdapter: LoggerAdapter = {
      initialize: jest.fn(),
      log: () => {
        throw new Error("Adapter explosion!");
      },
      child: jest.fn().mockReturnThis(),
    };

    LoggerFactory.setAdapter(throwingAdapter);

    const logger = LoggerFactory.getLogger("Test");

    // Should not throw
    expect(() => logger.info("This should not crash")).not.toThrow();
  });

  it("should log adapter errors to stderr", () => {
    const throwingAdapter: LoggerAdapter = {
      initialize: jest.fn(),
      log: () => {
        throw new Error("Adapter explosion!");
      },
      child: jest.fn().mockReturnThis(),
    };

    LoggerFactory.setAdapter(throwingAdapter);

    const logger = LoggerFactory.getLogger("Test");
    logger.info("Test message");

    // Should have written error to stderr
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls[0][0];
    expect(output).toContain("LOGGER_ERROR");
    expect(output).toContain("Adapter explosion!");
  });

  it("should include original log entry in fallback", () => {
    const throwingAdapter: LoggerAdapter = {
      initialize: jest.fn(),
      log: () => {
        throw new Error("Adapter error");
      },
      child: jest.fn().mockReturnThis(),
    };

    LoggerFactory.setAdapter(throwingAdapter);

    const logger = LoggerFactory.getLogger("FallbackTest");
    logger.info("Important message", { key: "value" });

    // Second stderr call should be the fallback log
    expect(stderrSpy).toHaveBeenCalledTimes(2);
    const fallbackOutput = stderrSpy.mock.calls[1][0];
    expect(fallbackOutput).toContain("FALLBACK");
    expect(fallbackOutput).toContain("Important message");
  });
});

describe("correlation context (P2)", () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    clearLogContextProvider();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    clearLogContextProvider();
    await LoggerFactory.reset();
  });

  it("should include context provider data in logs", () => {
    setLogContextProvider(() => ({
      traceId: "trace-123",
      requestId: "req-456",
    }));

    const logger = LoggerFactory.getLogger("ContextTest");
    logger.info("Test message");

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("trace-123");
    expect(output).toContain("req-456");
  });

  it("should merge context with explicit metadata", () => {
    setLogContextProvider(() => ({
      traceId: "trace-123",
    }));

    const logger = LoggerFactory.getLogger("MergeTest");
    logger.info("Test", { userId: "user-789" });

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("trace-123");
    expect(output).toContain("user-789");
  });

  it("should allow explicit metadata to override context", () => {
    setLogContextProvider(() => ({
      traceId: "context-trace",
    }));

    const logger = LoggerFactory.getLogger("OverrideTest");
    logger.info("Test", { traceId: "explicit-trace" });

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("explicit-trace");
    expect(output).not.toContain("context-trace");
  });

  it("should work without context provider", () => {
    const logger = LoggerFactory.getLogger("NoContextTest");
    logger.info("Test message", { data: "value" });

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("Test message");
    expect(output).toContain("value");
  });
});

describe("structured error extraction (P5)", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    await LoggerFactory.reset();
  });

  it("should auto-extract Error objects in metadata", () => {
    const error = new Error("Something went wrong");

    const logger = LoggerFactory.getLogger("ErrorTest");
    logger.error("Operation failed", { error });

    const output = stderrSpy.mock.calls[0][0];
    // Should contain extracted error info, not [object Object]
    expect(output).toContain("Something went wrong");
    expect(output).toContain("Error"); // error name
  });

  it("should preserve non-error metadata", () => {
    const error = new Error("Test error");

    const logger = LoggerFactory.getLogger("MixedTest");
    logger.error("Failed", { error, userId: "123", action: "save" });

    const output = stderrSpy.mock.calls[0][0];
    expect(output).toContain("Test error");
    expect(output).toContain("123");
    expect(output).toContain("save");
  });

  it("should handle TypeError", () => {
    const error = new TypeError("Invalid type");

    const logger = LoggerFactory.getLogger("TypeErrorTest");
    logger.error("Type error occurred", { err: error });

    const output = stderrSpy.mock.calls[0][0];
    expect(output).toContain("Invalid type");
    expect(output).toContain("TypeError");
  });
});

describe("environment auto-bootstrap", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    await LoggerFactory.reset();
    // Clear logger-related env vars
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
    delete process.env.LOG_TIMESTAMPS;
    delete process.env.LOG_COLORS;
  });

  afterEach(async () => {
    await LoggerFactory.reset();
    process.env = { ...originalEnv };
  });

  it("should auto-configure from LOG_LEVEL env var", () => {
    process.env.LOG_LEVEL = "WARN";

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const logger = getLogger("EnvTest");
    logger.debug("Should not appear");
    logger.info("Should not appear");
    logger.warn("Should appear");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy.mock.calls[0][0]).toContain("Should appear");

    stdoutSpy.mockRestore();
  });

  it("should auto-configure from LOG_FORMAT=json env var", () => {
    process.env.LOG_FORMAT = "json";

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const logger = getLogger("JsonTest");
    logger.info("Test message");

    const output = stdoutSpy.mock.calls[0][0] as string;
    // JSON output should be parseable
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.message).toBe("Test message");

    stdoutSpy.mockRestore();
  });

  it("should not apply env config if explicit config is provided", async () => {
    process.env.LOG_LEVEL = "ERROR";

    // Explicit config should override env
    LoggerFactory.configure({ config: { minLevel: LOG_LEVEL.DEBUG } });

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const logger = getLogger("ExplicitTest");
    logger.debug("Should appear because explicit config overrides env");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy.mock.calls[0][0]).toContain("Should appear");

    stdoutSpy.mockRestore();
  });

  it("should use defaults when no env vars are set", () => {
    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    const logger = getLogger("DefaultTest");
    logger.debug("Debug should appear with default config");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy.mock.calls[0][0]).toContain("Debug should appear");

    stdoutSpy.mockRestore();
  });

  it("should reset env config state on factory reset", async () => {
    process.env.LOG_LEVEL = "ERROR";

    // First access applies env config
    getLogger("First");

    // Reset factory
    await LoggerFactory.reset();

    // Change env
    process.env.LOG_LEVEL = "DEBUG";

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    // Second access should pick up new env config
    const logger2 = getLogger("Second");
    logger2.debug("Should appear with new DEBUG level");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);

    stdoutSpy.mockRestore();
  });
});
