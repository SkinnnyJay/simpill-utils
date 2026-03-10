import {
  getEdgeBoolean,
  getEdgeEnv,
  getEdgeNumber,
  getEdgeString,
} from "../../../src/client/env.edge";

describe("getEdgeString", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return the environment variable value when set", () => {
    process.env.TEST_STRING = "test-value";
    expect(getEdgeString("TEST_STRING", "default")).toBe("test-value");
  });

  it("should return default value when variable is not set", () => {
    delete process.env.TEST_STRING;
    expect(getEdgeString("TEST_STRING", "default")).toBe("default");
  });

  it("should return empty string as default when no default provided", () => {
    delete process.env.TEST_STRING;
    expect(getEdgeString("TEST_STRING")).toBe("");
  });
});

describe("getEdgeNumber", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return parsed number when valid", () => {
    process.env.TEST_NUMBER = "42";
    expect(getEdgeNumber("TEST_NUMBER", 0)).toBe(42);
  });

  it("should return default when value is not a number", () => {
    process.env.TEST_NUMBER = "not-a-number";
    expect(getEdgeNumber("TEST_NUMBER", 100)).toBe(100);
  });

  it("should return default when variable is not set", () => {
    delete process.env.TEST_NUMBER;
    expect(getEdgeNumber("TEST_NUMBER", 100)).toBe(100);
  });

  it("should return 0 as default when no default provided", () => {
    delete process.env.TEST_NUMBER;
    expect(getEdgeNumber("TEST_NUMBER")).toBe(0);
  });

  it("should parse negative numbers", () => {
    process.env.TEST_NUMBER = "-42";
    expect(getEdgeNumber("TEST_NUMBER", 0)).toBe(-42);
  });

  it("should parse floating point numbers", () => {
    process.env.TEST_NUMBER = "3.14";
    expect(getEdgeNumber("TEST_NUMBER", 0)).toBe(3.14);
  });
});

describe("getEdgeBoolean", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return true for 'true' string", () => {
    process.env.TEST_BOOL = "true";
    expect(getEdgeBoolean("TEST_BOOL", false)).toBe(true);
  });

  it("should return true for '1' string", () => {
    process.env.TEST_BOOL = "1";
    expect(getEdgeBoolean("TEST_BOOL", false)).toBe(true);
  });

  it("should return false for 'false' string", () => {
    process.env.TEST_BOOL = "false";
    expect(getEdgeBoolean("TEST_BOOL", true)).toBe(false);
  });

  it("should return false for '0' string", () => {
    process.env.TEST_BOOL = "0";
    expect(getEdgeBoolean("TEST_BOOL", true)).toBe(false);
  });

  it("should return default for invalid boolean string", () => {
    process.env.TEST_BOOL = "maybe";
    expect(getEdgeBoolean("TEST_BOOL", false)).toBe(false);
  });

  it("should return false as default when no default provided", () => {
    delete process.env.TEST_BOOL;
    expect(getEdgeBoolean("TEST_BOOL")).toBe(false);
  });

  it("should parse 'TRUE' (uppercase) as true", () => {
    process.env.TEST_BOOL = "TRUE";
    expect(getEdgeBoolean("TEST_BOOL", false)).toBe(true);
  });

  it("should parse 'FALSE' (uppercase) as false", () => {
    process.env.TEST_BOOL = "FALSE";
    expect(getEdgeBoolean("TEST_BOOL", true)).toBe(false);
  });

  it("should parse 'True' (mixed case) as true", () => {
    process.env.TEST_BOOL = "True";
    expect(getEdgeBoolean("TEST_BOOL", false)).toBe(true);
  });

  it("should parse 'False' (mixed case) as false", () => {
    process.env.TEST_BOOL = "False";
    expect(getEdgeBoolean("TEST_BOOL", true)).toBe(false);
  });

  it("should return default true for invalid boolean string", () => {
    process.env.TEST_BOOL = "invalid";
    expect(getEdgeBoolean("TEST_BOOL", true)).toBe(true);
  });
});

describe("getEdgeEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should infer type from default value (string)", () => {
    process.env.TEST = "value";
    const result = getEdgeEnv("TEST", "default");
    expect(result).toBe("value");
    expect(typeof result).toBe("string");
  });

  it("should infer type from default value (number)", () => {
    process.env.TEST = "42";
    const result = getEdgeEnv("TEST", 0);
    expect(result).toBe(42);
    expect(typeof result).toBe("number");
  });

  it("should infer type from default value (boolean)", () => {
    process.env.TEST = "true";
    const result = getEdgeEnv("TEST", false);
    expect(result).toBe(true);
    expect(typeof result).toBe("boolean");
  });

  it("should return default string when variable not set", () => {
    delete process.env.TEST;
    const result = getEdgeEnv("TEST", "default-string");
    expect(result).toBe("default-string");
  });

  it("should return default number when variable not set", () => {
    delete process.env.TEST;
    const result = getEdgeEnv("TEST", 999);
    expect(result).toBe(999);
  });

  it("should return default boolean when variable not set", () => {
    delete process.env.TEST;
    const result = getEdgeEnv("TEST", true);
    expect(result).toBe(true);
  });

  it("should return default number when value is NaN", () => {
    process.env.TEST = "not-a-number";
    const result = getEdgeEnv("TEST", 123);
    expect(result).toBe(123);
  });
});
