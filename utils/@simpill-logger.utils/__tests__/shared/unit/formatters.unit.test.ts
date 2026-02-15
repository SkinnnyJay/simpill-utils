/**
 * @file Formatters Unit Tests
 * @description Tests for log formatting utilities
 */

import { LOG_LEVEL } from "../../../src/shared/constants";
import {
  createFormatter,
  jsonFormatter,
  serializeMetadata,
  simpleFormatter,
  timestampFormatter,
} from "../../../src/shared/formatters";
import type { LogEntry } from "../../../src/shared/types";

describe("serializeMetadata", () => {
  it("should return empty string for undefined metadata", () => {
    expect(serializeMetadata(undefined)).toBe("");
  });

  it("should return empty string for empty metadata", () => {
    expect(serializeMetadata({})).toBe("");
  });

  it("should serialize simple metadata", () => {
    const metadata = { key: "value" };
    expect(serializeMetadata(metadata)).toBe('{"key":"value"}');
  });

  it("should serialize nested metadata", () => {
    const metadata = { outer: { inner: "value" } };
    expect(serializeMetadata(metadata)).toBe('{"outer":{"inner":"value"}}');
  });

  it("should handle circular references gracefully", () => {
    const circular: Record<string, unknown> = { key: "value" };
    circular.self = circular;
    const result = serializeMetadata(circular);
    expect(result).toBe('{"_serializationError":"Failed to serialize metadata"}');
  });
});

describe("simpleFormatter", () => {
  it("should format a basic log entry", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test message",
      name: "TestLogger",
    };
    const result = simpleFormatter(entry);
    expect(result).toBe('[INFO] Test message {"name":"TestLogger"}');
  });

  it("should include metadata in output", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.WARN,
      message: "Warning message",
      name: "TestLogger",
      metadata: { userId: "123" },
    };
    const result = simpleFormatter(entry);
    expect(result).toBe('[WARN] Warning message {"name":"TestLogger","userId":"123"}');
  });

  it("should handle all log levels", () => {
    const levels = [LOG_LEVEL.DEBUG, LOG_LEVEL.INFO, LOG_LEVEL.WARN, LOG_LEVEL.ERROR] as const;

    for (const level of levels) {
      const entry: LogEntry = {
        level,
        message: "Test",
        name: "Logger",
      };
      const result = simpleFormatter(entry);
      expect(result).toContain(`[${level}]`);
    }
  });
});

describe("jsonFormatter", () => {
  it("should format entry as JSON", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test message",
      name: "TestLogger",
    };
    const result = jsonFormatter(entry);
    const parsed = JSON.parse(result);

    expect(parsed.level).toBe("INFO");
    expect(parsed.message).toBe("Test message");
    expect(parsed.name).toBe("TestLogger");
  });

  it("should include timestamp when present", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
      timestamp: "2024-01-01T00:00:00.000Z",
    };
    const result = jsonFormatter(entry);
    const parsed = JSON.parse(result);

    expect(parsed.timestamp).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should include metadata when present", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
      metadata: { requestId: "abc-123" },
    };
    const result = jsonFormatter(entry);
    const parsed = JSON.parse(result);

    expect(parsed.metadata).toEqual({ requestId: "abc-123" });
  });

  it("should not include metadata key when empty", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
      metadata: {},
    };
    const result = jsonFormatter(entry);
    const parsed = JSON.parse(result);

    expect(parsed.metadata).toBeUndefined();
  });
});

describe("timestampFormatter", () => {
  it("should include timestamp prefix", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test message",
      name: "TestLogger",
      timestamp: "2024-01-01T12:00:00.000Z",
    };
    const result = timestampFormatter(entry);

    expect(result).toContain("[2024-01-01T12:00:00.000Z]");
    expect(result).toContain("[INFO]");
    expect(result).toContain("Test message");
  });

  it("should generate timestamp if not provided", () => {
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = timestampFormatter(entry);

    // Should have ISO timestamp format
    expect(result).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
  });
});

describe("createFormatter", () => {
  it("should create formatter with default options", () => {
    const formatter = createFormatter();
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = formatter(entry);

    expect(result).toContain("[INFO]");
    expect(result).toContain("Test");
    expect(result).toContain("Logger");
  });

  it("should include timestamp when configured", () => {
    const formatter = createFormatter({ includeTimestamp: true });
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = formatter(entry);

    expect(result).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
  });

  it("should exclude level when configured", () => {
    const formatter = createFormatter({ includeLevel: false });
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = formatter(entry);

    expect(result).not.toContain("[INFO]");
    expect(result).toContain("Test");
  });

  it("should exclude name when configured", () => {
    const formatter = createFormatter({ includeName: false });
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = formatter(entry);

    expect(result).not.toContain('"name"');
  });

  it("should return JSON formatter when configured", () => {
    const formatter = createFormatter({ jsonOutput: true });
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
    };
    const result = formatter(entry);
    const parsed = JSON.parse(result);

    expect(parsed.level).toBe("INFO");
    expect(parsed.message).toBe("Test");
  });

  it("should handle metadata in custom formatter", () => {
    const formatter = createFormatter({ includeName: true });
    const entry: LogEntry = {
      level: LOG_LEVEL.INFO,
      message: "Test",
      name: "Logger",
      metadata: { key: "value" },
    };
    const result = formatter(entry);

    expect(result).toContain('"key":"value"');
  });
});
