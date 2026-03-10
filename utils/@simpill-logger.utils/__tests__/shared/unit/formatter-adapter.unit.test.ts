/**
 * @file Formatter Adapter Unit Tests
 * @description Tests for the formatter adapter interface
 */

import { LOG_LEVEL } from "../../../src/shared/constants";
import {
  createFormatterContext,
  type FormatterAdapter,
  type FormatterContext,
  formatWithAdapter,
  isFormatterAdapter,
  outputToString,
} from "../../../src/shared/formatters";
import type { LogEntry } from "../../../src/shared/types";

describe("isFormatterAdapter", () => {
  it("should return false for null", () => {
    expect(isFormatterAdapter(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isFormatterAdapter(undefined)).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isFormatterAdapter("string")).toBe(false);
    expect(isFormatterAdapter(123)).toBe(false);
    expect(isFormatterAdapter(true)).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isFormatterAdapter({})).toBe(false);
  });

  it("should return false for object missing methods", () => {
    expect(isFormatterAdapter({ formatInfo: () => "" })).toBe(false);
    expect(isFormatterAdapter({ formatInfo: () => "", formatWarn: () => "" })).toBe(false);
  });

  it("should return true for valid formatter adapter", () => {
    const validAdapter: FormatterAdapter = {
      formatInfo: () => "",
      formatWarn: () => "",
      formatDebug: () => "",
      formatError: () => "",
    };
    expect(isFormatterAdapter(validAdapter)).toBe(true);
  });
});

describe("createFormatterContext", () => {
  it("should create context from log entry", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test message",
      name: "TestLogger",
      timestamp: "2024-01-01T00:00:00.000Z",
      metadata: { key: "value" },
    };

    const context = createFormatterContext(entry);

    expect(context.loggerName).toBe("TestLogger");
    expect(context.level).toBe("INFO");
    expect(context.timestamp).toBe("2024-01-01T00:00:00.000Z");
    expect(context.message).toBe("Test message");
    expect(context.metadata).toEqual({ key: "value" });
  });

  it("should generate timestamp if not provided", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };

    const context = createFormatterContext(entry);

    expect(context.timestamp).toBeDefined();
    expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("should include pid in Node.js environment", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };

    const context = createFormatterContext(entry);

    expect(context.pid).toBe(process.pid);
  });
});

describe("formatWithAdapter", () => {
  it("should call formatInfo for INFO level", () => {
    const mockAdapter: FormatterAdapter = {
      formatInfo: jest.fn((ctx: FormatterContext) => `INFO: ${ctx.message}`),
      formatWarn: jest.fn(),
      formatDebug: jest.fn(),
      formatError: jest.fn(),
    };

    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Info message",
      name: "Test",
    };

    const result = formatWithAdapter(mockAdapter, entry);

    expect(mockAdapter.formatInfo).toHaveBeenCalled();
    expect(result).toBe("INFO: Info message");
  });

  it("should call formatWarn for WARN level", () => {
    const mockAdapter: FormatterAdapter = {
      formatInfo: jest.fn(),
      formatWarn: jest.fn((ctx: FormatterContext) => `WARN: ${ctx.message}`),
      formatDebug: jest.fn(),
      formatError: jest.fn(),
    };

    const entry: LogEntry = {
      level: LOG_LEVEL.WARN,
      message: "Warn message",
      name: "Test",
    };

    const result = formatWithAdapter(mockAdapter, entry);

    expect(mockAdapter.formatWarn).toHaveBeenCalled();
    expect(result).toBe("WARN: Warn message");
  });

  it("should call formatDebug for DEBUG level", () => {
    const mockAdapter: FormatterAdapter = {
      formatInfo: jest.fn(),
      formatWarn: jest.fn(),
      formatDebug: jest.fn((ctx: FormatterContext) => `DEBUG: ${ctx.message}`),
      formatError: jest.fn(),
    };

    const entry: LogEntry = {
      level: LOG_LEVEL.DEBUG,
      message: "Debug message",
      name: "Test",
    };

    const result = formatWithAdapter(mockAdapter, entry);

    expect(mockAdapter.formatDebug).toHaveBeenCalled();
    expect(result).toBe("DEBUG: Debug message");
  });

  it("should call formatError for ERROR level", () => {
    const mockAdapter: FormatterAdapter = {
      formatInfo: jest.fn(),
      formatWarn: jest.fn(),
      formatDebug: jest.fn(),
      formatError: jest.fn((ctx: FormatterContext) => `ERROR: ${ctx.message}`),
    };

    const entry: LogEntry = {
      level: LOG_LEVEL.ERROR,
      message: "Error message",
      name: "Test",
    };

    const result = formatWithAdapter(mockAdapter, entry);

    expect(mockAdapter.formatError).toHaveBeenCalled();
    expect(result).toBe("ERROR: Error message");
  });

  it("should pass full context to formatter", () => {
    const mockAdapter: FormatterAdapter = {
      formatInfo: jest.fn((ctx: FormatterContext) => ctx.message),
      formatWarn: jest.fn(),
      formatDebug: jest.fn(),
      formatError: jest.fn(),
    };

    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "MyLogger",
      timestamp: "2024-01-01T00:00:00.000Z",
      metadata: { userId: "123" },
    };

    formatWithAdapter(mockAdapter, entry);

    expect(mockAdapter.formatInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        loggerName: "MyLogger",
        level: "INFO",
        timestamp: "2024-01-01T00:00:00.000Z",
        message: "Test",
        metadata: { userId: "123" },
      })
    );
  });
});

describe("outputToString", () => {
  it("should return string as-is", () => {
    expect(outputToString("hello")).toBe("hello");
  });

  it("should stringify objects", () => {
    const obj = { level: "INFO", message: "test" };
    expect(outputToString(obj)).toBe('{"level":"INFO","message":"test"}');
  });

  it("should handle nested objects", () => {
    const obj = { outer: { inner: "value" } };
    expect(outputToString(obj)).toBe('{"outer":{"inner":"value"}}');
  });
});
