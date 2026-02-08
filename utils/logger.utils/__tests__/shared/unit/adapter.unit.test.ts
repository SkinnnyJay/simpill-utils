/**
 * @file Adapter Unit Tests
 * @description Tests for the logger adapter interface
 */

import { isLoggerAdapter, type LoggerAdapter } from "../../../src/shared/adapter";
import type { LogEntry } from "../../../src/shared/types";

describe("isLoggerAdapter", () => {
  it("should return false for null", () => {
    expect(isLoggerAdapter(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isLoggerAdapter(undefined)).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isLoggerAdapter("string")).toBe(false);
    expect(isLoggerAdapter(123)).toBe(false);
    expect(isLoggerAdapter(true)).toBe(false);
  });

  it("should return false for empty object", () => {
    expect(isLoggerAdapter({})).toBe(false);
  });

  it("should return false for object missing methods", () => {
    expect(isLoggerAdapter({ initialize: () => {} })).toBe(false);
    expect(isLoggerAdapter({ log: () => {} })).toBe(false);
    expect(isLoggerAdapter({ child: () => {} })).toBe(false);
  });

  it("should return true for valid adapter", () => {
    const validAdapter: LoggerAdapter = {
      initialize: () => {},
      log: () => {},
      child: () => validAdapter,
    };
    expect(isLoggerAdapter(validAdapter)).toBe(true);
  });

  it("should return true for adapter with optional methods", () => {
    const validAdapter: LoggerAdapter = {
      initialize: () => {},
      log: () => {},
      child: () => validAdapter,
      flush: async () => {},
      destroy: async () => {},
    };
    expect(isLoggerAdapter(validAdapter)).toBe(true);
  });
});

describe("LoggerAdapter interface", () => {
  it("should allow implementing a custom adapter", () => {
    const logs: LogEntry[] = [];

    const customAdapter: LoggerAdapter = {
      initialize: jest.fn(),
      log: (entry: LogEntry) => {
        logs.push(entry);
      },
      child: (name: string) => {
        return {
          ...customAdapter,
          log: (entry: LogEntry) => {
            logs.push({ ...entry, name });
          },
        };
      },
    };

    customAdapter.initialize({});
    customAdapter.log({
      level: "INFO",
      message: "Test message",
      name: "TestLogger",
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe("Test message");
    expect(customAdapter.initialize).toHaveBeenCalled();
  });
});
