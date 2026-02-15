/**
 * @file Buffered Adapter Unit Tests
 * @description Tests for buffered async logging adapter
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "../../../src/shared/adapter";
import { BufferedLoggerAdapter, createBufferedAdapter } from "../../../src/shared/buffered-adapter";
import { LOG_LEVEL } from "../../../src/shared/constants";
import type { LogEntry, LogMetadata } from "../../../src/shared/types";

/**
 * Mock adapter for testing
 */
class MockAdapter implements LoggerAdapter {
  public logs: LogEntry[] = [];
  public initialized = false;
  public destroyed = false;
  public flushed = false;
  public shouldThrow = false;

  initialize(_config: LoggerAdapterConfig): void {
    this.initialized = true;
  }

  log(entry: LogEntry): void {
    if (this.shouldThrow) {
      throw new Error("Mock adapter error");
    }
    this.logs.push(entry);
  }

  child(_name: string, _defaultMetadata?: LogMetadata): LoggerAdapter {
    const child = new MockAdapter();
    child.logs = this.logs; // Share logs array
    return child;
  }

  async flush(): Promise<void> {
    this.flushed = true;
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
  }
}

describe("BufferedLoggerAdapter", () => {
  let mockAdapter: MockAdapter;
  let bufferedAdapter: BufferedLoggerAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    bufferedAdapter = new BufferedLoggerAdapter(mockAdapter, {
      maxBufferSize: 5,
      flushIntervalMs: 100,
    });
  });

  afterEach(async () => {
    await bufferedAdapter.destroy();
  });

  describe("constructor", () => {
    it("should create adapter with default config", () => {
      const adapter = new BufferedLoggerAdapter(mockAdapter);
      expect(adapter.getBufferSize()).toBe(0);
    });

    it("should create adapter with custom config", () => {
      const adapter = new BufferedLoggerAdapter(mockAdapter, {
        maxBufferSize: 10,
        flushIntervalMs: 500,
      });
      expect(adapter.getBufferSize()).toBe(0);
    });
  });

  describe("initialize", () => {
    it("should initialize inner adapter", () => {
      bufferedAdapter.initialize({ minLevel: LOG_LEVEL.INFO });

      expect(mockAdapter.initialized).toBe(true);
    });
  });

  describe("log", () => {
    beforeEach(() => {
      bufferedAdapter.initialize({});
    });

    it("should buffer log entries", () => {
      const entry: LogEntry = {
        level: LOG_LEVEL.INFO,
        message: "Test message",
        name: "Test",
        timestamp: new Date().toISOString(),
      };

      bufferedAdapter.log(entry);

      expect(bufferedAdapter.getBufferSize()).toBe(1);
      expect(mockAdapter.logs.length).toBe(0); // Not flushed yet
    });

    it("should auto-flush when buffer is full", () => {
      bufferedAdapter.initialize({});

      // Fill buffer to max (5)
      for (let i = 0; i < 5; i++) {
        bufferedAdapter.log({
          level: LOG_LEVEL.INFO,
          message: `Message ${i}`,
          name: "Test",
          timestamp: new Date().toISOString(),
        });
      }

      // Should have flushed
      expect(mockAdapter.logs.length).toBe(5);
      expect(bufferedAdapter.getBufferSize()).toBe(0);
    });

    it("should not log after destroy", async () => {
      await bufferedAdapter.destroy();

      bufferedAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "After destroy",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      expect(bufferedAdapter.getBufferSize()).toBe(0);
    });
  });

  describe("flush", () => {
    beforeEach(() => {
      bufferedAdapter.initialize({});
    });

    it("should flush buffered entries to inner adapter", async () => {
      bufferedAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test 1",
        name: "Test",
        timestamp: new Date().toISOString(),
      });
      bufferedAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test 2",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      await bufferedAdapter.flush();

      expect(mockAdapter.logs.length).toBe(2);
      expect(bufferedAdapter.getBufferSize()).toBe(0);
    });

    it("should call inner adapter flush", async () => {
      bufferedAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      await bufferedAdapter.flush();

      expect(mockAdapter.flushed).toBe(true);
    });

    it("should handle empty buffer", async () => {
      await bufferedAdapter.flush();

      expect(mockAdapter.logs.length).toBe(0);
    });

    it("should handle flush errors with callback", async () => {
      const errors: unknown[] = [];
      const adapter = new BufferedLoggerAdapter(mockAdapter, {
        maxBufferSize: 10,
        flushIntervalMs: 1000,
        onFlushError: (err) => errors.push(err),
      });
      adapter.initialize({});

      mockAdapter.shouldThrow = true;

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      await adapter.flush();

      expect(errors.length).toBe(1);
      expect((errors[0] as Error).message).toBe("Mock adapter error");
    });

    it("should restore entries to buffer when flush fails", async () => {
      const onFlushError = jest.fn();
      const adapter = new BufferedLoggerAdapter(mockAdapter, {
        maxBufferSize: 10,
        flushIntervalMs: 1000,
        onFlushError,
      });
      adapter.initialize({});

      mockAdapter.shouldThrow = true;

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "First",
        name: "Test",
        timestamp: new Date().toISOString(),
      });
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Second",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      await adapter.flush();

      expect(onFlushError).toHaveBeenCalledTimes(1);
      expect(adapter.getBufferSize()).toBe(2);
      const [err, entries] = onFlushError.mock.calls[0] as [unknown, LogEntry[]];
      expect((err as Error).message).toBe("Mock adapter error");
      expect(entries).toHaveLength(2);
      expect(entries[0].message).toBe("First");
      expect(entries[1].message).toBe("Second");
    });

    it("should restore entries when flushSync fails (buffer full)", () => {
      const onFlushError = jest.fn();
      const adapter = new BufferedLoggerAdapter(mockAdapter, {
        maxBufferSize: 3,
        flushIntervalMs: 1000,
        onFlushError,
      });
      adapter.initialize({});

      mockAdapter.shouldThrow = true;

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "A",
        name: "Test",
        timestamp: new Date().toISOString(),
      });
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "B",
        name: "Test",
        timestamp: new Date().toISOString(),
      });
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "C",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      expect(onFlushError).toHaveBeenCalledTimes(1);
      expect(adapter.getBufferSize()).toBe(3);
    });
  });

  describe("child", () => {
    beforeEach(() => {
      bufferedAdapter.initialize({});
    });

    it("should create child adapter", () => {
      const child = bufferedAdapter.child("ChildLogger");

      expect(child).toBeDefined();
    });

    it("should share buffer with parent", async () => {
      const child = bufferedAdapter.child("ChildLogger");

      child.log({
        level: LOG_LEVEL.INFO,
        message: "From child",
        name: "ChildLogger",
        timestamp: new Date().toISOString(),
      });

      expect(bufferedAdapter.getBufferSize()).toBe(1);

      await bufferedAdapter.flush();

      expect(mockAdapter.logs.length).toBe(1);
      expect(mockAdapter.logs[0].name).toBe("ChildLogger");
    });

    it("should merge default metadata", async () => {
      const child = bufferedAdapter.child("ChildLogger", { service: "test" });

      child.log({
        level: LOG_LEVEL.INFO,
        message: "From child",
        name: "",
        timestamp: new Date().toISOString(),
        metadata: { extra: "data" },
      });

      await bufferedAdapter.flush();

      expect(mockAdapter.logs[0].metadata).toEqual({
        service: "test",
        extra: "data",
      });
    });
  });

  describe("destroy", () => {
    beforeEach(() => {
      bufferedAdapter.initialize({});
    });

    it("should flush remaining entries", async () => {
      bufferedAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "Before destroy",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      await bufferedAdapter.destroy();

      expect(mockAdapter.logs.length).toBe(1);
    });

    it("should destroy inner adapter", async () => {
      await bufferedAdapter.destroy();

      expect(mockAdapter.destroyed).toBe(true);
    });
  });

  describe("periodic flush", () => {
    it("should flush periodically", async () => {
      const adapter = new BufferedLoggerAdapter(mockAdapter, {
        maxBufferSize: 100,
        flushIntervalMs: 50,
      });
      adapter.initialize({});

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
        timestamp: new Date().toISOString(),
      });

      // Wait for periodic flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAdapter.logs.length).toBe(1);

      await adapter.destroy();
    });
  });
});

describe("createBufferedAdapter", () => {
  it("should create BufferedLoggerAdapter", () => {
    const mockAdapter = new MockAdapter();
    const buffered = createBufferedAdapter(mockAdapter);

    expect(buffered).toBeInstanceOf(BufferedLoggerAdapter);
  });

  it("should pass config to adapter", () => {
    const mockAdapter = new MockAdapter();
    const buffered = createBufferedAdapter(mockAdapter, {
      maxBufferSize: 50,
    });

    expect(buffered).toBeInstanceOf(BufferedLoggerAdapter);
  });
});
