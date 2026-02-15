/**
 * @file Multi-Transport Adapter Unit Tests
 * @description Tests for the MultiTransportAdapter composition
 */

import { createMultiAdapter, MultiTransportAdapter } from "../../src/adapters/multi.adapter";
import type { LoggerAdapter, LoggerAdapterConfig } from "../../src/shared/adapter";
import { LOG_LEVEL } from "../../src/shared/constants";
import type { LogEntry, LogMetadata } from "../../src/shared/types";

/**
 * Create a mock adapter for testing
 */
function createMockAdapter(): LoggerAdapter & {
  logs: LogEntry[];
  config: LoggerAdapterConfig | null;
  flushed: boolean;
  destroyed: boolean;
  children: Array<{ name: string; metadata?: LogMetadata }>;
} {
  const logs: LogEntry[] = [];
  const children: Array<{ name: string; metadata?: LogMetadata }> = [];
  let flushed = false;
  let destroyed = false;

  const mockAdapter: LoggerAdapter & {
    logs: LogEntry[];
    config: LoggerAdapterConfig | null;
    flushed: boolean;
    destroyed: boolean;
    children: Array<{ name: string; metadata?: LogMetadata }>;
  } = {
    logs,
    config: null,
    flushed,
    destroyed,
    children,
    initialize: (cfg: LoggerAdapterConfig) => {
      mockAdapter.config = cfg;
    },
    log: (entry: LogEntry) => {
      logs.push(entry);
    },
    child: (name: string, defaultMetadata?: LogMetadata) => {
      children.push({ name, metadata: defaultMetadata });
      return createMockAdapter();
    },
    flush: async () => {
      flushed = true;
      mockAdapter.flushed = true;
    },
    destroy: async () => {
      destroyed = true;
      mockAdapter.destroyed = true;
    },
  };

  return mockAdapter;
}

describe("MultiTransportAdapter", () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create adapter with multiple adapters", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();

      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      expect(multi).toBeInstanceOf(MultiTransportAdapter);
      expect(multi.adapterCount).toBe(2);
    });

    it("should throw error if no adapters provided", () => {
      expect(() => new MultiTransportAdapter([])).toThrow(
        "MultiTransportAdapter requires at least one adapter"
      );
    });

    it("should create adapter with single adapter", () => {
      const adapter = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter]);

      expect(multi.adapterCount).toBe(1);
    });
  });

  describe("initialize", () => {
    it("should initialize all child adapters", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      const config: LoggerAdapterConfig = { minLevel: LOG_LEVEL.INFO };
      multi.initialize(config);

      expect(adapter1.config).toEqual(config);
      expect(adapter2.config).toEqual(config);
    });
  });

  describe("log", () => {
    it("should broadcast log to all adapters", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const adapter3 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2, adapter3]);

      const entry: LogEntry = {
        level: LOG_LEVEL.INFO,
        message: "Test message",
        name: "TestLogger",
      };

      multi.log(entry);

      expect(adapter1.logs).toHaveLength(1);
      expect(adapter2.logs).toHaveLength(1);
      expect(adapter3.logs).toHaveLength(1);
      expect(adapter1.logs[0]).toEqual(entry);
      expect(adapter2.logs[0]).toEqual(entry);
      expect(adapter3.logs[0]).toEqual(entry);
    });

    it("should continue logging to other adapters if one fails", () => {
      const adapter1 = createMockAdapter();
      const failingAdapter: LoggerAdapter = {
        initialize: () => {},
        log: () => {
          throw new Error("Adapter failed");
        },
        child: () => failingAdapter,
      };
      const adapter3 = createMockAdapter();

      const multi = new MultiTransportAdapter([adapter1, failingAdapter, adapter3]);

      const entry: LogEntry = {
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
      };

      // Should not throw
      expect(() => multi.log(entry)).not.toThrow();

      // Other adapters should still receive the log
      expect(adapter1.logs).toHaveLength(1);
      expect(adapter3.logs).toHaveLength(1);
    });

    it("should log adapter errors to stderr", () => {
      const failingAdapter: LoggerAdapter = {
        initialize: () => {},
        log: () => {
          throw new Error("Test error message");
        },
        child: () => failingAdapter,
      };

      const multi = new MultiTransportAdapter([failingAdapter]);

      multi.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("MULTI_TRANSPORT_ERROR"));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Test error message"));
    });

    it("should handle non-Error exceptions", () => {
      const failingAdapter: LoggerAdapter = {
        initialize: () => {},
        log: () => {
          throw new Error("String error");
        },
        child: () => failingAdapter,
      };

      const multi = new MultiTransportAdapter([failingAdapter]);

      expect(() =>
        multi.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" })
      ).not.toThrow();

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("String error"));
    });
  });

  describe("child", () => {
    it("should create child adapters for all transports", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      const childMulti = multi.child("ChildLogger");

      expect(adapter1.children).toHaveLength(1);
      expect(adapter2.children).toHaveLength(1);
      expect(adapter1.children[0].name).toBe("ChildLogger");
      expect(adapter2.children[0].name).toBe("ChildLogger");
      expect(childMulti).toBeInstanceOf(MultiTransportAdapter);
    });

    it("should pass metadata to all child adapters", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      multi.child("Child", { service: "api", version: "1.0" });

      expect(adapter1.children[0].metadata).toEqual({ service: "api", version: "1.0" });
      expect(adapter2.children[0].metadata).toEqual({ service: "api", version: "1.0" });
    });

    it("should return functional child multi-adapter", () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      const childMulti = multi.child("Child");

      // The child should also be a MultiTransportAdapter
      expect((childMulti as MultiTransportAdapter).adapterCount).toBe(2);
    });
  });

  describe("flush", () => {
    it("should flush all adapters that support flushing", async () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      await multi.flush();

      expect(adapter1.flushed).toBe(true);
      expect(adapter2.flushed).toBe(true);
    });

    it("should handle adapters without flush method", async () => {
      const adapterWithFlush = createMockAdapter();
      const adapterWithoutFlush: LoggerAdapter = {
        initialize: () => {},
        log: () => {},
        child: () => adapterWithoutFlush,
        // No flush method
      };

      const multi = new MultiTransportAdapter([adapterWithFlush, adapterWithoutFlush]);

      await expect(multi.flush()).resolves.toBeUndefined();
      expect(adapterWithFlush.flushed).toBe(true);
    });

    it("should flush all adapters in parallel", async () => {
      const flushOrder: number[] = [];

      const slowAdapter: LoggerAdapter = {
        initialize: () => {},
        log: () => {},
        child: () => slowAdapter,
        flush: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          flushOrder.push(1);
        },
      };

      const fastAdapter: LoggerAdapter = {
        initialize: () => {},
        log: () => {},
        child: () => fastAdapter,
        flush: async () => {
          flushOrder.push(2);
        },
      };

      const multi = new MultiTransportAdapter([slowAdapter, fastAdapter]);

      await multi.flush();

      // Fast adapter should complete first due to parallel execution
      expect(flushOrder).toEqual([2, 1]);
    });
  });

  describe("destroy", () => {
    it("should destroy all adapters that support cleanup", async () => {
      const adapter1 = createMockAdapter();
      const adapter2 = createMockAdapter();
      const multi = new MultiTransportAdapter([adapter1, adapter2]);

      await multi.destroy();

      expect(adapter1.destroyed).toBe(true);
      expect(adapter2.destroyed).toBe(true);
    });

    it("should handle adapters without destroy method", async () => {
      const adapterWithDestroy = createMockAdapter();
      const adapterWithoutDestroy: LoggerAdapter = {
        initialize: () => {},
        log: () => {},
        child: () => adapterWithoutDestroy,
        // No destroy method
      };

      const multi = new MultiTransportAdapter([adapterWithDestroy, adapterWithoutDestroy]);

      await expect(multi.destroy()).resolves.toBeUndefined();
      expect(adapterWithDestroy.destroyed).toBe(true);
    });
  });

  describe("adapterCount", () => {
    it("should return correct count", () => {
      const adapters = [createMockAdapter(), createMockAdapter(), createMockAdapter()];
      const multi = new MultiTransportAdapter(adapters);

      expect(multi.adapterCount).toBe(3);
    });
  });
});

describe("createMultiAdapter", () => {
  it("should create adapter from array", () => {
    const adapter1 = createMockAdapter();
    const adapter2 = createMockAdapter();

    const multi = createMultiAdapter([adapter1, adapter2]);

    expect(multi).toBeInstanceOf(MultiTransportAdapter);
    expect(multi.adapterCount).toBe(2);
  });
});
