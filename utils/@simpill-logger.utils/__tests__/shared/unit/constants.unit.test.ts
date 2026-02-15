/**
 * @file Constants Unit Tests
 * @description Tests for shared logger constants
 */

import {
  ANSI_COLORS,
  BOOLEAN_FALSY_VALUES,
  BOOLEAN_TRUTHY_VALUES,
  LOG_LEVEL,
  LOG_LEVEL_LOWER,
  LOGGER_CONTEXT,
  LOGGER_DEFAULTS,
  METADATA_KEYS,
  OUTPUT_CHARS,
} from "../../../src/shared/constants";

describe("LOG_LEVEL", () => {
  it("should have INFO level", () => {
    expect(LOG_LEVEL.INFO).toBe("INFO");
  });

  it("should have WARN level", () => {
    expect(LOG_LEVEL.WARN).toBe("WARN");
  });

  it("should have DEBUG level", () => {
    expect(LOG_LEVEL.DEBUG).toBe("DEBUG");
  });

  it("should have ERROR level", () => {
    expect(LOG_LEVEL.ERROR).toBe("ERROR");
  });
});

describe("LOG_LEVEL_LOWER", () => {
  it("should have lowercase info level", () => {
    expect(LOG_LEVEL_LOWER.INFO).toBe("info");
  });

  it("should have lowercase warn level", () => {
    expect(LOG_LEVEL_LOWER.WARN).toBe("warn");
  });

  it("should have lowercase debug level", () => {
    expect(LOG_LEVEL_LOWER.DEBUG).toBe("debug");
  });

  it("should have lowercase error level", () => {
    expect(LOG_LEVEL_LOWER.ERROR).toBe("error");
  });
});

describe("LOGGER_CONTEXT", () => {
  it("should have DEFAULT context", () => {
    expect(LOGGER_CONTEXT.DEFAULT).toBe("Logger");
  });

  it("should have LOG_INSTANCE context", () => {
    expect(LOGGER_CONTEXT.LOG_INSTANCE).toBe("Log");
  });
});

describe("METADATA_KEYS", () => {
  it("should have TABLE key", () => {
    expect(METADATA_KEYS.TABLE).toBe("table");
  });

  it("should have TIMESTAMP key", () => {
    expect(METADATA_KEYS.TIMESTAMP).toBe("timestamp");
  });

  it("should have LEVEL key", () => {
    expect(METADATA_KEYS.LEVEL).toBe("level");
  });

  it("should have NAME key", () => {
    expect(METADATA_KEYS.NAME).toBe("name");
  });
});

describe("LOGGER_DEFAULTS", () => {
  it("should have TIMESTAMP_FORMAT default", () => {
    expect(LOGGER_DEFAULTS.TIMESTAMP_FORMAT).toBe("ISO");
  });

  it("should have MIN_LOG_LEVEL default", () => {
    expect(LOGGER_DEFAULTS.MIN_LOG_LEVEL).toBe(LOG_LEVEL.DEBUG);
  });

  it("should have MAX_METADATA_DEPTH default", () => {
    expect(LOGGER_DEFAULTS.MAX_METADATA_DEPTH).toBe(5);
  });
});

describe("BOOLEAN_TRUTHY_VALUES", () => {
  it("should contain 'true' and '1' (strict, from protocols.utils)", () => {
    expect(BOOLEAN_TRUTHY_VALUES).toContain("true");
    expect(BOOLEAN_TRUTHY_VALUES).toContain("1");
  });

  it("should have exactly 2 values", () => {
    expect(BOOLEAN_TRUTHY_VALUES).toHaveLength(2);
  });
});

describe("BOOLEAN_FALSY_VALUES", () => {
  it("should contain 'false' and '0' (strict, from protocols.utils)", () => {
    expect(BOOLEAN_FALSY_VALUES).toContain("false");
    expect(BOOLEAN_FALSY_VALUES).toContain("0");
  });

  it("should have exactly 2 values", () => {
    expect(BOOLEAN_FALSY_VALUES).toHaveLength(2);
  });
});

describe("OUTPUT_CHARS", () => {
  it("should have NEWLINE character", () => {
    expect(OUTPUT_CHARS.NEWLINE).toBe("\n");
  });
});

describe("ANSI_COLORS", () => {
  it("should have reset code", () => {
    expect(ANSI_COLORS.reset).toBe("\x1b[0m");
  });

  it("should have bright code", () => {
    expect(ANSI_COLORS.bright).toBe("\x1b[1m");
  });

  it("should have dim code", () => {
    expect(ANSI_COLORS.dim).toBe("\x1b[2m");
  });

  it("should have foreground colors", () => {
    expect(ANSI_COLORS.black).toBe("\x1b[30m");
    expect(ANSI_COLORS.red).toBe("\x1b[31m");
    expect(ANSI_COLORS.green).toBe("\x1b[32m");
    expect(ANSI_COLORS.yellow).toBe("\x1b[33m");
    expect(ANSI_COLORS.blue).toBe("\x1b[34m");
    expect(ANSI_COLORS.magenta).toBe("\x1b[35m");
    expect(ANSI_COLORS.cyan).toBe("\x1b[36m");
    expect(ANSI_COLORS.white).toBe("\x1b[37m");
  });

  it("should have background colors", () => {
    expect(ANSI_COLORS.bgRed).toBe("\x1b[41m");
    expect(ANSI_COLORS.bgYellow).toBe("\x1b[43m");
  });
});
