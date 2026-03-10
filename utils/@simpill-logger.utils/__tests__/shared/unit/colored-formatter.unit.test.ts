/**
 * @file Colored Formatter Unit Tests
 * @description Tests for the ColoredFormatterAdapter
 */

import {
  COLORS,
  ColoredFormatterAdapter,
  coloredFormatter,
  createColoredFormatter,
  type FormattedOutput,
  type FormatterContext,
} from "../../../src/shared/formatters";

/** Type guard + assertion: use when formatter must return a string. */
function getStringOutput(result: FormattedOutput): string {
  expect(typeof result).toBe("string");
  if (typeof result !== "string") throw new Error("expected string");
  return result;
}

describe("ColoredFormatterAdapter", () => {
  const createContext = (overrides: Partial<FormatterContext> = {}): FormatterContext => ({
    loggerName: "TestLogger",
    level: "INFO",
    timestamp: "2024-01-01T12:00:00.000Z",
    message: "Test message",
    metadata: { key: "value" },
    ...overrides,
  });

  describe("default configuration", () => {
    const formatter = new ColoredFormatterAdapter();

    it("should include ANSI color codes", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain("\x1b["); // ANSI escape sequence
    });

    it("should include reset code", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.reset);
    });

    it("should include timestamp", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain("2024-01-01T12:00:00.000Z");
    });

    it("should include logger name", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain("TestLogger:");
    });

    it("should include message", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain("Test message");
    });

    it("should include metadata", () => {
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain('"key":"value"');
    });
  });

  describe("formatInfo", () => {
    it("should use blue color for INFO", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.blue);
      expect(out).toContain("[INFO]");
    });
  });

  describe("formatWarn", () => {
    it("should use yellow color for WARN", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatWarn(createContext({ level: "WARN" }));
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.yellow);
      expect(out).toContain("[WARN]");
    });
  });

  describe("formatDebug", () => {
    it("should use magenta color for DEBUG", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatDebug(createContext({ level: "DEBUG" }));
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.magenta);
      expect(out).toContain("[DEBUG]");
    });
  });

  describe("formatError", () => {
    it("should use red color for ERROR", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatError(createContext({ level: "ERROR" }));
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.red);
      expect(out).toContain("[ERROR]");
    });
  });

  describe("configuration options", () => {
    it("should exclude timestamp when configured", () => {
      const formatter = new ColoredFormatterAdapter({ includeTimestamp: false });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).not.toContain("2024-01-01T12:00:00.000Z");
    });

    it("should exclude name when configured", () => {
      const formatter = new ColoredFormatterAdapter({ includeName: false });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).not.toContain("TestLogger:");
    });

    it("should exclude metadata when configured", () => {
      const formatter = new ColoredFormatterAdapter({ includeMetadata: false });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).not.toContain('"key"');
    });

    it("should not use bright colors when configured", () => {
      const formatter = new ColoredFormatterAdapter({ bright: false });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).not.toContain(COLORS.bright);
    });
  });

  describe("custom colors", () => {
    it("should use custom info color", () => {
      const formatter = new ColoredFormatterAdapter({
        colors: { info: COLORS.green },
      });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.green);
    });

    it("should use custom error color", () => {
      const formatter = new ColoredFormatterAdapter({
        colors: { error: COLORS.bgRed },
      });
      const result = formatter.formatError(createContext({ level: "ERROR" }));
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.bgRed);
    });

    it("should use custom timestamp color", () => {
      const formatter = new ColoredFormatterAdapter({
        colors: { timestamp: COLORS.cyan },
      });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.cyan);
    });

    it("should use custom name color", () => {
      const formatter = new ColoredFormatterAdapter({
        colors: { name: COLORS.green },
      });
      const result = formatter.formatInfo(createContext());
      const out = getStringOutput(result);
      expect(out).toContain(COLORS.green);
    });
  });

  describe("empty metadata handling", () => {
    it("should not include empty metadata", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatInfo(createContext({ metadata: {} }));
      const out = getStringOutput(result);
      expect(out).not.toContain("{}");
    });

    it("should not include undefined metadata", () => {
      const formatter = new ColoredFormatterAdapter();
      const result = formatter.formatInfo(createContext({ metadata: undefined }));
      const out = getStringOutput(result);
      expect(out).not.toContain("undefined");
    });
  });
});

describe("createColoredFormatter", () => {
  it("should create formatter with config", () => {
    const formatter = createColoredFormatter({ includeTimestamp: false });
    expect(formatter).toBeInstanceOf(ColoredFormatterAdapter);
  });

  it("should create formatter with default config", () => {
    const formatter = createColoredFormatter();
    expect(formatter).toBeInstanceOf(ColoredFormatterAdapter);
  });
});

describe("coloredFormatter", () => {
  it("should be a ColoredFormatterAdapter instance", () => {
    expect(coloredFormatter).toBeInstanceOf(ColoredFormatterAdapter);
  });
});

describe("COLORS", () => {
  it("should export reset code", () => {
    expect(COLORS.reset).toBe("\x1b[0m");
  });

  it("should export bright code", () => {
    expect(COLORS.bright).toBe("\x1b[1m");
  });

  it("should export foreground colors", () => {
    expect(COLORS.red).toBe("\x1b[31m");
    expect(COLORS.green).toBe("\x1b[32m");
    expect(COLORS.yellow).toBe("\x1b[33m");
    expect(COLORS.blue).toBe("\x1b[34m");
    expect(COLORS.magenta).toBe("\x1b[35m");
    expect(COLORS.cyan).toBe("\x1b[36m");
  });

  it("should export background colors", () => {
    expect(COLORS.bgRed).toBe("\x1b[41m");
    expect(COLORS.bgYellow).toBe("\x1b[43m");
  });
});
