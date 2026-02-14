import {
  EnvManager,
  extendProcessEnvPrototype,
  MissingEnvError,
} from "../../../src/server/env.utils";

describe("extendProcessEnvPrototype", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    EnvManager.resetInstance();
    process.env = originalEnv;
  });

  it("should add getString method to process.env", () => {
    process.env.TEST_STRING = "test-value";
    extendProcessEnvPrototype();
    expect(typeof process.env.getString).toBe("function");
    expect(process.env.getString("TEST_STRING", "default")).toBe("test-value");
  });

  it("should add getNumber method to process.env", () => {
    process.env.TEST_NUMBER = "42";
    extendProcessEnvPrototype();
    expect(typeof process.env.getNumber).toBe("function");
    expect(process.env.getNumber("TEST_NUMBER", 0)).toBe(42);
  });

  it("should add getBoolean method to process.env", () => {
    process.env.TEST_BOOL = "true";
    extendProcessEnvPrototype();
    expect(typeof process.env.getBoolean).toBe("function");
    expect(process.env.getBoolean("TEST_BOOL", false)).toBe(true);
  });

  it("should add has method to process.env", () => {
    process.env.TEST_HAS = "value";
    extendProcessEnvPrototype();
    expect(typeof process.env.has).toBe("function");
    expect(process.env.has("TEST_HAS")).toBe(true);
    expect(process.env.has("NON_EXISTENT")).toBe(false);
  });

  it("should add getRequired method to process.env", () => {
    process.env.TEST_REQUIRED = "required-value";
    extendProcessEnvPrototype();
    expect(typeof process.env.getRequired).toBe("function");
    expect(process.env.getRequired("TEST_REQUIRED")).toBe("required-value");
  });

  it("should throw MissingEnvError when getRequired is called for missing key", () => {
    extendProcessEnvPrototype();
    expect(() => process.env.getRequired("NON_EXISTENT")).toThrow(MissingEnvError);
    expect(() => process.env.getRequired("NON_EXISTENT")).toThrow(
      'Required environment variable "NON_EXISTENT" is not set'
    );
  });

  it("should use default values when not provided for getString", () => {
    extendProcessEnvPrototype();
    expect(process.env.getString("NON_EXISTENT_FOR_DEFAULT")).toBe("");
  });

  it("should use default values when not provided for getNumber", () => {
    extendProcessEnvPrototype();
    expect(process.env.getNumber("NON_EXISTENT_FOR_DEFAULT")).toBe(0);
  });

  it("should use default values when not provided for getBoolean", () => {
    extendProcessEnvPrototype();
    expect(process.env.getBoolean("NON_EXISTENT_FOR_DEFAULT")).toBe(false);
  });

  it("should add getRequiredString and delegate to getRequired", () => {
    process.env.REQ_STR = "req-str";
    extendProcessEnvPrototype();
    expect(typeof process.env.getRequiredString).toBe("function");
    expect(process.env.getRequiredString("REQ_STR")).toBe("req-str");
    expect(() => process.env.getRequiredString("MISSING_REQ_STR")).toThrow();
  });

  it("should add getRequiredNumber and delegate", () => {
    process.env.REQ_NUM = "99";
    extendProcessEnvPrototype();
    expect(process.env.getRequiredNumber("REQ_NUM")).toBe(99);
    expect(() => process.env.getRequiredNumber("MISSING_NUM")).toThrow();
  });

  it("should add getRequiredBoolean and delegate", () => {
    process.env.REQ_BOOL = "true";
    extendProcessEnvPrototype();
    expect(process.env.getRequiredBoolean("REQ_BOOL")).toBe(true);
    expect(() => process.env.getRequiredBoolean("MISSING_BOOL")).toThrow();
  });

  it("should add isEncrypted and getDecrypted to process.env", () => {
    process.env.PLAIN_KEY = "plain-value";
    extendProcessEnvPrototype();
    expect(typeof process.env.isEncrypted).toBe("function");
    expect(typeof process.env.getDecrypted).toBe("function");
    expect(process.env.isEncrypted("PLAIN_KEY")).toBe(false);
    expect(process.env.getDecrypted("PLAIN_KEY")).toBe("plain-value");
  });
});

describe("MissingEnvError", () => {
  it("should have correct name and key properties", () => {
    const error = new MissingEnvError("MY_VAR");
    expect(error.name).toBe("MissingEnvError");
    expect(error.key).toBe("MY_VAR");
    expect(error.message).toBe('Required environment variable "MY_VAR" is not set');
  });

  it("should be an instance of Error", () => {
    const error = new MissingEnvError("MY_VAR");
    expect(error).toBeInstanceOf(Error);
  });
});
