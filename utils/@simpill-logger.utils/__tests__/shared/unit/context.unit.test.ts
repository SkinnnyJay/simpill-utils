/**
 * @file Context Unit Tests
 * @description Tests for log context provider functionality
 */

import {
  clearLogContextProvider,
  getLogContext,
  hasLogContextProvider,
  type LogContext,
  setLogContextProvider,
  withLogContext,
} from "../../../src/shared/context";

describe("Log Context Provider", () => {
  beforeEach(() => {
    clearLogContextProvider();
  });

  afterEach(() => {
    clearLogContextProvider();
  });

  describe("setLogContextProvider", () => {
    it("should set a context provider", () => {
      const context: LogContext = { traceId: "trace-123" };
      setLogContextProvider(() => context);

      expect(getLogContext()).toEqual(context);
    });

    it("should replace existing provider", () => {
      setLogContextProvider(() => ({ traceId: "old" }));
      setLogContextProvider(() => ({ traceId: "new" }));

      expect(getLogContext()?.traceId).toBe("new");
    });
  });

  describe("getLogContext", () => {
    it("should return undefined when no provider is set", () => {
      expect(getLogContext()).toBeUndefined();
    });

    it("should return context from provider", () => {
      const context: LogContext = {
        traceId: "trace-123",
        requestId: "req-456",
        userId: "user-789",
      };
      setLogContextProvider(() => context);

      expect(getLogContext()).toEqual(context);
    });

    it("should return undefined if provider returns undefined", () => {
      setLogContextProvider(() => undefined);

      expect(getLogContext()).toBeUndefined();
    });

    it("should handle provider errors gracefully", () => {
      setLogContextProvider(() => {
        throw new Error("Provider error");
      });

      // Should not throw, returns undefined
      expect(getLogContext()).toBeUndefined();
    });
  });

  describe("clearLogContextProvider", () => {
    it("should clear the provider", () => {
      setLogContextProvider(() => ({ traceId: "123" }));
      clearLogContextProvider();

      expect(getLogContext()).toBeUndefined();
    });
  });

  describe("hasLogContextProvider", () => {
    it("should return false when no provider is set", () => {
      expect(hasLogContextProvider()).toBe(false);
    });

    it("should return true when provider is set", () => {
      setLogContextProvider(() => ({}));

      expect(hasLogContextProvider()).toBe(true);
    });

    it("should return false after clearing", () => {
      setLogContextProvider(() => ({}));
      clearLogContextProvider();

      expect(hasLogContextProvider()).toBe(false);
    });
  });

  describe("withLogContext", () => {
    it("should return additional context when no provider is set", () => {
      const additional = { spanId: "span-123" };

      expect(withLogContext(additional)).toEqual(additional);
    });

    it("should merge with existing context", () => {
      setLogContextProvider(() => ({ traceId: "trace-123" }));
      const additional = { spanId: "span-456" };

      expect(withLogContext(additional)).toEqual({
        traceId: "trace-123",
        spanId: "span-456",
      });
    });

    it("should allow additional to override parent context", () => {
      setLogContextProvider(() => ({ traceId: "old", requestId: "req-123" }));
      const additional = { traceId: "new" };

      expect(withLogContext(additional)).toEqual({
        traceId: "new",
        requestId: "req-123",
      });
    });
  });

  describe("LogContext interface", () => {
    it("should support all standard fields", () => {
      const context: LogContext = {
        traceId: "trace-123",
        spanId: "span-456",
        requestId: "req-789",
        userId: "user-abc",
        sessionId: "sess-def",
        tenantId: "tenant-ghi",
      };

      setLogContextProvider(() => context);

      const retrieved = getLogContext();
      expect(retrieved?.traceId).toBe("trace-123");
      expect(retrieved?.spanId).toBe("span-456");
      expect(retrieved?.requestId).toBe("req-789");
      expect(retrieved?.userId).toBe("user-abc");
      expect(retrieved?.sessionId).toBe("sess-def");
      expect(retrieved?.tenantId).toBe("tenant-ghi");
    });

    it("should support custom fields", () => {
      const context: LogContext = {
        customField: "custom-value",
        nested: { deep: "value" },
      };

      setLogContextProvider(() => context);

      const retrieved = getLogContext();
      expect(retrieved?.customField).toBe("custom-value");
      expect(retrieved?.nested).toEqual({ deep: "value" });
    });
  });
});
