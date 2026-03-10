import { EnvParseError } from "../../../src/shared/errors";
import {
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
} from "../../../src/shared/parse-helpers";

describe("parseNumberEnvValue", () => {
  it("should parse valid integer string", () => {
    expect(parseNumberEnvValue("42", 0)).toBe(42);
  });

  it("should parse valid floating-point string", () => {
    expect(parseNumberEnvValue("3.14", 0)).toBe(3.14);
  });

  it("should parse negative numbers", () => {
    expect(parseNumberEnvValue("-42", 0)).toBe(-42);
    expect(parseNumberEnvValue("-3.14", 0)).toBe(-3.14);
  });

  it("should return default for invalid number", () => {
    expect(parseNumberEnvValue("not-a-number", 100)).toBe(100);
  });

  it("should return default for NaN", () => {
    expect(parseNumberEnvValue("NaN", 100)).toBe(100);
  });

  it("should return default for empty string", () => {
    expect(parseNumberEnvValue("", 100)).toBe(100);
  });

  it("should handle scientific notation", () => {
    expect(parseNumberEnvValue("1e10", 0)).toBe(1e10);
    expect(parseNumberEnvValue("1.5e-3", 0)).toBe(0.0015);
  });
});

describe("parseBooleanEnvValue", () => {
  it("should parse 'true' as true", () => {
    expect(parseBooleanEnvValue("true", false)).toBe(true);
  });

  it("should parse '1' as true", () => {
    expect(parseBooleanEnvValue("1", false)).toBe(true);
  });

  it("should parse 'false' as false", () => {
    expect(parseBooleanEnvValue("false", true)).toBe(false);
  });

  it("should parse '0' as false", () => {
    expect(parseBooleanEnvValue("0", true)).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(parseBooleanEnvValue("TRUE", false)).toBe(true);
    expect(parseBooleanEnvValue("True", false)).toBe(true);
    expect(parseBooleanEnvValue("FALSE", true)).toBe(false);
    expect(parseBooleanEnvValue("False", true)).toBe(false);
  });

  it("should return default for invalid boolean", () => {
    expect(parseBooleanEnvValue("maybe", false)).toBe(false);
    expect(parseBooleanEnvValue("yes", true)).toBe(true);
  });

  it("should return default for empty string", () => {
    expect(parseBooleanEnvValue("", true)).toBe(true);
    expect(parseBooleanEnvValue("", false)).toBe(false);
  });
});

describe("parseNumberEnvValueStrict", () => {
  it("should parse valid integer string", () => {
    expect(parseNumberEnvValueStrict("PORT", "42")).toBe(42);
  });

  it("should parse valid floating-point string", () => {
    expect(parseNumberEnvValueStrict("RATE", "3.14")).toBe(3.14);
  });

  it("should parse negative numbers", () => {
    expect(parseNumberEnvValueStrict("OFFSET", "-42")).toBe(-42);
  });

  it("should throw EnvParseError for invalid number", () => {
    expect(() => parseNumberEnvValueStrict("PORT", "not-a-number")).toThrow(EnvParseError);
    try {
      parseNumberEnvValueStrict("PORT", "abc");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvParseError);
      if (e instanceof EnvParseError) {
        expect(e.key).toBe("PORT");
        expect(e.rawValue).toBe("abc");
        expect(e.expectedType).toBe("number");
      }
    }
  });

  it("should throw EnvParseError for NaN string", () => {
    expect(() => parseNumberEnvValueStrict("VALUE", "NaN")).toThrow(EnvParseError);
  });

  it("should throw EnvParseError for empty string", () => {
    expect(() => parseNumberEnvValueStrict("PORT", "")).toThrow(EnvParseError);
  });

  it("should handle scientific notation", () => {
    expect(parseNumberEnvValueStrict("BIG", "1e10")).toBe(1e10);
  });
});

describe("parseBooleanEnvValueStrict", () => {
  it("should parse 'true' as true", () => {
    expect(parseBooleanEnvValueStrict("DEBUG", "true")).toBe(true);
  });

  it("should parse '1' as true", () => {
    expect(parseBooleanEnvValueStrict("DEBUG", "1")).toBe(true);
  });

  it("should parse 'false' as false", () => {
    expect(parseBooleanEnvValueStrict("DEBUG", "false")).toBe(false);
  });

  it("should parse '0' as false", () => {
    expect(parseBooleanEnvValueStrict("DEBUG", "0")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(parseBooleanEnvValueStrict("FLAG", "TRUE")).toBe(true);
    expect(parseBooleanEnvValueStrict("FLAG", "False")).toBe(false);
  });

  it("should throw EnvParseError for invalid boolean", () => {
    expect(() => parseBooleanEnvValueStrict("DEBUG", "maybe")).toThrow(EnvParseError);
    try {
      parseBooleanEnvValueStrict("DEBUG", "yes");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvParseError);
      if (e instanceof EnvParseError) {
        expect(e.key).toBe("DEBUG");
        expect(e.rawValue).toBe("yes");
        expect(e.expectedType).toBe("boolean");
      }
    }
  });

  it("should throw EnvParseError for empty string", () => {
    expect(() => parseBooleanEnvValueStrict("DEBUG", "")).toThrow(EnvParseError);
  });
});
