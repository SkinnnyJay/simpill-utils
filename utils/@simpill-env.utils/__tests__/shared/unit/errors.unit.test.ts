import {
  ENV_ERROR_CODE,
  EnvDecryptError,
  EnvError,
  EnvParseError,
  EnvValidationError,
  MissingEnvError,
} from "../../../src/shared/errors";

describe("EnvError", () => {
  it("should create error with default code", () => {
    const error = new EnvError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_ERROR);
    expect(error.name).toBe("EnvError");
    expect(error).toBeInstanceOf(Error);
  });

  it("should create error with custom code", () => {
    const error = new EnvError("Test error", ENV_ERROR_CODE.ENV_MISSING);
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_MISSING);
  });

  it("should have proper stack trace", () => {
    const error = new EnvError("Test error");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("EnvError");
  });
});

describe("MissingEnvError", () => {
  it("should create error with key", () => {
    const error = new MissingEnvError("API_KEY");
    expect(error.message).toBe('Required environment variable "API_KEY" is not set');
    expect(error.key).toBe("API_KEY");
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_MISSING);
    expect(error.name).toBe("MissingEnvError");
  });

  it("should be instanceof EnvError", () => {
    const error = new MissingEnvError("API_KEY");
    expect(error).toBeInstanceOf(EnvError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should be catchable as EnvError", () => {
    try {
      throw new MissingEnvError("SECRET");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvError);
      if (e instanceof MissingEnvError) {
        expect(e.key).toBe("SECRET");
      }
    }
  });
});

describe("EnvParseError", () => {
  it("should create error for number parse failure", () => {
    const error = new EnvParseError("PORT", "not-a-number", "number");
    expect(error.message).toBe(
      'Failed to parse environment variable "PORT" as number: got "not-a-number"'
    );
    expect(error.key).toBe("PORT");
    expect(error.rawValue).toBe("not-a-number");
    expect(error.expectedType).toBe("number");
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_PARSE);
    expect(error.name).toBe("EnvParseError");
  });

  it("should create error for boolean parse failure", () => {
    const error = new EnvParseError("DEBUG", "maybe", "boolean");
    expect(error.message).toBe(
      'Failed to parse environment variable "DEBUG" as boolean: got "maybe"'
    );
    expect(error.expectedType).toBe("boolean");
  });

  it("should be instanceof EnvError", () => {
    const error = new EnvParseError("PORT", "abc", "number");
    expect(error).toBeInstanceOf(EnvError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("EnvValidationError", () => {
  it("should create error with string value", () => {
    const error = new EnvValidationError("API_URL", "not-a-url", "must be a valid URL");
    expect(error.message).toBe(
      'Environment variable "API_URL" failed validation: must be a valid URL (got "not-a-url")'
    );
    expect(error.key).toBe("API_URL");
    expect(error.value).toBe("not-a-url");
    expect(error.reason).toBe("must be a valid URL");
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_VALIDATION);
    expect(error.name).toBe("EnvValidationError");
  });

  it("should create error with number value", () => {
    const error = new EnvValidationError("PORT", 99999, "must be between 1 and 65535");
    expect(error.message).toBe(
      'Environment variable "PORT" failed validation: must be between 1 and 65535 (got 99999)'
    );
    expect(error.value).toBe(99999);
  });

  it("should create error with boolean value", () => {
    const error = new EnvValidationError("ENABLED", false, "must be true in production");
    expect(error.value).toBe(false);
  });

  it("should be instanceof EnvError", () => {
    const error = new EnvValidationError("KEY", "value", "reason");
    expect(error).toBeInstanceOf(EnvError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("EnvDecryptError", () => {
  it("should create error with key and reason", () => {
    const error = new EnvDecryptError("SECRET_KEY", "invalid private key");
    expect(error.message).toBe(
      'Failed to decrypt environment variable "SECRET_KEY": invalid private key'
    );
    expect(error.key).toBe("SECRET_KEY");
    expect(error.reason).toBe("invalid private key");
    expect(error.code).toBe(ENV_ERROR_CODE.ENV_DECRYPT);
    expect(error.name).toBe("EnvDecryptError");
  });

  it("should be instanceof EnvError", () => {
    const error = new EnvDecryptError("KEY", "reason");
    expect(error).toBeInstanceOf(EnvError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should handle inline key for parseEncrypted errors", () => {
    const error = new EnvDecryptError("(inline)", "Value is not encrypted");
    expect(error.key).toBe("(inline)");
    expect(error.message).toContain("(inline)");
  });
});

describe("ENV_ERROR_CODE", () => {
  it("should have all expected codes", () => {
    expect(ENV_ERROR_CODE.ENV_ERROR).toBe("ENV_ERROR");
    expect(ENV_ERROR_CODE.ENV_MISSING).toBe("ENV_MISSING");
    expect(ENV_ERROR_CODE.ENV_PARSE).toBe("ENV_PARSE");
    expect(ENV_ERROR_CODE.ENV_VALIDATION).toBe("ENV_VALIDATION");
    expect(ENV_ERROR_CODE.ENV_DECRYPT).toBe("ENV_DECRYPT");
  });
});

describe("Error discrimination", () => {
  it("should allow catching specific error types", () => {
    const errors: EnvError[] = [
      new MissingEnvError("KEY1"),
      new EnvParseError("KEY2", "abc", "number"),
      new EnvValidationError("KEY3", 0, "must be positive"),
      new EnvDecryptError("KEY4", "no private key"),
    ];

    const results: string[] = [];

    for (const error of errors) {
      if (error instanceof MissingEnvError) {
        results.push(`missing:${error.key}`);
      } else if (error instanceof EnvParseError) {
        results.push(`parse:${error.key}:${error.expectedType}`);
      } else if (error instanceof EnvValidationError) {
        results.push(`validation:${error.key}:${error.reason}`);
      } else if (error instanceof EnvDecryptError) {
        results.push(`decrypt:${error.key}:${error.reason}`);
      }
    }

    expect(results).toEqual([
      "missing:KEY1",
      "parse:KEY2:number",
      "validation:KEY3:must be positive",
      "decrypt:KEY4:no private key",
    ]);
  });

  it("should allow discrimination by error code", () => {
    const error: EnvError = new MissingEnvError("KEY");

    switch (error.code) {
      case ENV_ERROR_CODE.ENV_MISSING:
        expect(true).toBe(true);
        break;
      default:
        fail("Should have matched ENV_MISSING");
    }
  });

  it("should allow discrimination by ENV_DECRYPT code", () => {
    const error: EnvError = new EnvDecryptError("KEY", "reason");

    switch (error.code) {
      case ENV_ERROR_CODE.ENV_DECRYPT:
        expect(true).toBe(true);
        break;
      default:
        fail("Should have matched ENV_DECRYPT");
    }
  });
});
