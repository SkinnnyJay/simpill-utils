/**
 * @file Simple Formatter Unit Tests
 * @description Tests for the SimpleFormatterAdapter
 */

import {
  createSimpleFormatter,
  defaultFormatter,
  type FormattedOutput,
  type FormatterContext,
  jsonFormatterAdapter as jsonFormatter,
  minimalFormatter,
  SimpleFormatterAdapter,
} from "../../../src/shared/formatters";

function assertJsonOutput(result: FormattedOutput): asserts result is Record<string, unknown> {
  expect(typeof result).toBe("object");
  expect(result).not.toBe(null);
}

describe("SimpleFormatterAdapter", () => {
  const createContext = (overrides: Partial<FormatterContext> = {}): FormatterContext => ({
    loggerName: "TestLogger",
    level: "INFO",
    timestamp: "2024-01-01T12:00:00.000Z",
    message: "Test message",
    metadata: { key: "value" },
    pid: 12345,
    ...overrides,
  });

  describe("default configuration", () => {
    const formatter = new SimpleFormatterAdapter();

    it("should include timestamp by default", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).toContain("[2024-01-01T12:00:00.000Z]");
    });

    it("should include level by default", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).toContain("[INFO]");
    });

    it("should include logger name by default", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).toContain("TestLogger:");
    });

    it("should include message", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).toContain("Test message");
    });

    it("should include metadata by default", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).toContain('"key":"value"');
    });

    it("should not include PID by default", () => {
      const result = formatter.formatInfo(createContext());
      expect(result).not.toContain("12345");
    });
  });

  describe("formatInfo", () => {
    it("should format INFO level", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatInfo(createContext({ level: "INFO" }));
      expect(result).toContain("[INFO]");
    });
  });

  describe("formatWarn", () => {
    it("should format WARN level", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatWarn(createContext({ level: "WARN" }));
      expect(result).toContain("[WARN]");
    });
  });

  describe("formatDebug", () => {
    it("should format DEBUG level", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatDebug(createContext({ level: "DEBUG" }));
      expect(result).toContain("[DEBUG]");
    });
  });

  describe("formatError", () => {
    it("should format ERROR level", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatError(createContext({ level: "ERROR" }));
      expect(result).toContain("[ERROR]");
    });
  });

  describe("configuration options", () => {
    it("should exclude timestamp when configured", () => {
      const formatter = new SimpleFormatterAdapter({ includeTimestamp: false });
      const result = formatter.formatInfo(createContext());
      expect(result).not.toContain("[2024-01-01T12:00:00.000Z]");
    });

    it("should exclude level when configured", () => {
      const formatter = new SimpleFormatterAdapter({ includeLevel: false });
      const result = formatter.formatInfo(createContext());
      expect(result).not.toContain("[INFO]");
    });

    it("should exclude name when configured", () => {
      const formatter = new SimpleFormatterAdapter({ includeName: false });
      const result = formatter.formatInfo(createContext());
      expect(result).not.toContain("TestLogger:");
    });

    it("should exclude metadata when configured", () => {
      const formatter = new SimpleFormatterAdapter({ includeMetadata: false });
      const result = formatter.formatInfo(createContext());
      expect(result).not.toContain('"key"');
    });

    it("should include PID when configured", () => {
      const jsonFmt = new SimpleFormatterAdapter({ includePid: true, jsonOutput: true });
      const jsonResult = jsonFmt.formatInfo(createContext());
      assertJsonOutput(jsonResult);
      expect(jsonResult.pid).toBe(12345);
    });
  });

  describe("JSON output", () => {
    it("should output JSON when configured", () => {
      const formatter = new SimpleFormatterAdapter({ jsonOutput: true });
      const result = formatter.formatInfo(createContext());
      assertJsonOutput(result);
      expect(result.level).toBe("INFO");
      expect(result.message).toBe("Test message");
    });

    it("should include all fields in JSON output", () => {
      const formatter = new SimpleFormatterAdapter({ jsonOutput: true });
      const result = formatter.formatInfo(createContext());
      assertJsonOutput(result);
      expect(result.timestamp).toBe("2024-01-01T12:00:00.000Z");
      expect(result.level).toBe("INFO");
      expect(result.name).toBe("TestLogger");
      expect(result.message).toBe("Test message");
      expect(result.metadata).toEqual({ key: "value" });
    });

    it("should respect configuration in JSON output", () => {
      const formatter = new SimpleFormatterAdapter({
        jsonOutput: true,
        includeTimestamp: false,
        includeName: false,
      });
      const result = formatter.formatInfo(createContext());
      assertJsonOutput(result);
      expect(result.timestamp).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.message).toBe("Test message");
    });
  });

  describe("custom level labels", () => {
    it("should use custom level labels", () => {
      const formatter = new SimpleFormatterAdapter({
        levelLabels: { INFO: "INFORMATION", WARN: "WARNING" },
      });

      const infoResult = formatter.formatInfo(createContext({ level: "INFO" }));
      const warnResult = formatter.formatWarn(createContext({ level: "WARN" }));

      expect(infoResult).toContain("[INFORMATION]");
      expect(warnResult).toContain("[WARNING]");
    });
  });

  describe("custom timestamp formatter", () => {
    it("should use custom timestamp formatter", () => {
      const formatter = new SimpleFormatterAdapter({
        timestampFormatter: (ts) => ts.split("T")[0], // Just date
      });

      const result = formatter.formatInfo(createContext());
      expect(result).toContain("[2024-01-01]");
      expect(result).not.toContain("12:00:00");
    });
  });

  describe("empty metadata handling", () => {
    it("should not include empty metadata object", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatInfo(createContext({ metadata: {} }));
      expect(result).not.toContain("{}");
    });

    it("should not include undefined metadata", () => {
      const formatter = new SimpleFormatterAdapter();
      const result = formatter.formatInfo(createContext({ metadata: undefined }));
      expect(result).not.toContain("undefined");
    });
  });
});

describe("createSimpleFormatter", () => {
  it("should create formatter with config", () => {
    const formatter = createSimpleFormatter({ includeTimestamp: false });
    expect(formatter).toBeInstanceOf(SimpleFormatterAdapter);
  });

  it("should create formatter with default config", () => {
    const formatter = createSimpleFormatter();
    expect(formatter).toBeInstanceOf(SimpleFormatterAdapter);
  });
});

describe("Pre-configured formatters", () => {
  const context: FormatterContext = {
    loggerName: "Test",
    level: "INFO",
    timestamp: "2024-01-01T00:00:00.000Z",
    message: "Hello",
    metadata: { key: "value" },
  };

  describe("defaultFormatter", () => {
    it("should be a SimpleFormatterAdapter instance", () => {
      expect(defaultFormatter).toBeInstanceOf(SimpleFormatterAdapter);
    });

    it("should include all default fields", () => {
      const result = defaultFormatter.formatInfo(context);
      expect(result).toContain("[INFO]");
      expect(result).toContain("Test:");
      expect(result).toContain("Hello");
    });
  });

  describe("jsonFormatter", () => {
    it("should output JSON", () => {
      const result = jsonFormatter.formatInfo(context);
      expect(typeof result).toBe("object");
    });
  });

  describe("minimalFormatter", () => {
    it("should exclude timestamp and name", () => {
      const result = minimalFormatter.formatInfo(context);
      expect(typeof result).toBe("string");
      expect(result).not.toContain("2024-01-01");
      expect(result).not.toContain("Test:");
      expect(result).toContain("[INFO]");
      expect(result).toContain("Hello");
    });
  });

  describe("verboseFormatter", () => {
    it("should include PID in JSON output", () => {
      const verboseJson = new SimpleFormatterAdapter({
        includePid: true,
        jsonOutput: true,
      });
      const result = verboseJson.formatInfo({ ...context, pid: 999 });
      assertJsonOutput(result);
      expect(result.pid).toBe(999);
    });
  });
});
