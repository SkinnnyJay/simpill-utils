/**
 * @file Error Extraction Unit Tests
 * @description Tests for structured error extraction utilities
 */

import {
  extractErrorInfo,
  isErrorLike,
  normalizeErrorsInMetadata,
} from "../../../src/shared/types";

describe("extractErrorInfo", () => {
  it("should return undefined for non-Error values", () => {
    expect(extractErrorInfo(null)).toBeUndefined();
    expect(extractErrorInfo(undefined)).toBeUndefined();
    expect(extractErrorInfo("string")).toBeUndefined();
    expect(extractErrorInfo(123)).toBeUndefined();
    expect(extractErrorInfo({})).toBeUndefined();
    expect(extractErrorInfo({ message: "not an error" })).toBeUndefined();
  });

  it("should extract basic error info", () => {
    const error = new Error("Test error");
    const info = extractErrorInfo(error);

    expect(info).toBeDefined();
    expect(info?.name).toBe("Error");
    expect(info?.message).toBe("Test error");
    expect(info?.stack).toBeDefined();
  });

  it("should extract error name for custom errors", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("Custom message");
    const info = extractErrorInfo(error);

    expect(info?.name).toBe("CustomError");
    expect(info?.message).toBe("Custom message");
  });

  it("should extract TypeError info", () => {
    const error = new TypeError("Type mismatch");
    const info = extractErrorInfo(error);

    expect(info?.name).toBe("TypeError");
    expect(info?.message).toBe("Type mismatch");
  });

  it("should extract error code from Node.js errors", () => {
    const error = new Error("File not found") as NodeJS.ErrnoException;
    error.code = "ENOENT";

    const info = extractErrorInfo(error);

    expect(info?.code).toBe("ENOENT");
  });

  it("should extract cause chain", () => {
    const cause = new Error("Root cause");
    const error = new Error("Wrapper error", { cause });

    const info = extractErrorInfo(error);

    expect(info?.cause).toBeDefined();
    expect((info?.cause as { name: string }).name).toBe("Error");
    expect((info?.cause as { message: string }).message).toBe("Root cause");
  });

  it("should handle non-Error cause", () => {
    const error = new Error("Wrapper error", { cause: "string cause" });

    const info = extractErrorInfo(error);

    expect(info?.cause).toBe("string cause");
  });

  it("should limit cause chain depth", () => {
    const level3 = new Error("Level 3");
    const level2 = new Error("Level 2", { cause: level3 });
    const level1 = new Error("Level 1", { cause: level2 });
    const root = new Error("Root", { cause: level1 });

    // Default maxDepth is 3
    const info = extractErrorInfo(root);

    expect(info?.message).toBe("Root");
    expect((info?.cause as { message: string }).message).toBe("Level 1");
    expect(((info?.cause as { cause: unknown }).cause as { message: string }).message).toBe(
      "Level 2"
    );
    // Level 3 should still be extracted at depth 3
    expect(
      (
        ((info?.cause as { cause: unknown }).cause as { cause: unknown }).cause as {
          message: string;
        }
      ).message
    ).toBe("Level 3");
  });

  it("should respect custom maxDepth", () => {
    const level2 = new Error("Level 2");
    const level1 = new Error("Level 1", { cause: level2 });
    const root = new Error("Root", { cause: level1 });

    const info = extractErrorInfo(root, 1);

    expect(info?.message).toBe("Root");
    expect((info?.cause as { message: string }).message).toBe("Level 1");
    // Level 2 should not be extracted
    expect((info?.cause as { cause: unknown }).cause).toBeUndefined();
  });
});

describe("isErrorLike", () => {
  it("should return true for Error instances", () => {
    expect(isErrorLike(new Error("test"))).toBe(true);
    expect(isErrorLike(new TypeError("test"))).toBe(true);
    expect(isErrorLike(new RangeError("test"))).toBe(true);
  });

  it("should return true for error-like objects", () => {
    const errorLike = {
      name: "CustomError",
      message: "Something went wrong",
    };

    expect(isErrorLike(errorLike)).toBe(true);
  });

  it("should return false for non-error values", () => {
    expect(isErrorLike(null)).toBe(false);
    expect(isErrorLike(undefined)).toBe(false);
    expect(isErrorLike("string")).toBe(false);
    expect(isErrorLike(123)).toBe(false);
    expect(isErrorLike({})).toBe(false);
    expect(isErrorLike({ message: "only message" })).toBe(false);
    expect(isErrorLike({ name: "only name" })).toBe(false);
    expect(isErrorLike({ name: 123, message: "wrong type" })).toBe(false);
  });
});

describe("normalizeErrorsInMetadata", () => {
  it("should return undefined for undefined metadata", () => {
    expect(normalizeErrorsInMetadata(undefined)).toBeUndefined();
  });

  it("should return original metadata if no errors", () => {
    const metadata = { key: "value", count: 42 };
    const result = normalizeErrorsInMetadata(metadata);

    expect(result).toBe(metadata); // Same reference
  });

  it("should convert Error objects to ErrorInfo", () => {
    const error = new Error("Test error");
    const metadata = { error, other: "data" };

    const result = normalizeErrorsInMetadata(metadata);

    expect(result).not.toBe(metadata); // Different reference
    expect(result?.other).toBe("data");
    expect((result?.error as { name: string }).name).toBe("Error");
    expect((result?.error as { message: string }).message).toBe("Test error");
  });

  it("should handle multiple errors", () => {
    const error1 = new Error("Error 1");
    const error2 = new TypeError("Error 2");
    const metadata = { err1: error1, err2: error2, data: "value" };

    const result = normalizeErrorsInMetadata(metadata);

    expect((result?.err1 as { name: string }).name).toBe("Error");
    expect((result?.err2 as { name: string }).name).toBe("TypeError");
    expect(result?.data).toBe("value");
  });

  it("should pass through error-like objects unchanged", () => {
    // normalizeErrorsInMetadata only extracts from actual Error instances
    // Error-like plain objects pass through unchanged
    const errorLike = { name: "CustomError", message: "Custom message" };
    const metadata = { error: errorLike };

    const result = normalizeErrorsInMetadata(metadata);

    // Should be the same reference since no actual Errors were found
    expect(result).toBe(metadata);
    expect(result?.error).toEqual(errorLike);
  });

  it("should preserve non-error nested objects", () => {
    const metadata = {
      user: { id: "123", name: "Test" },
      error: new Error("Test"),
    };

    const result = normalizeErrorsInMetadata(metadata);

    expect(result?.user).toEqual({ id: "123", name: "Test" });
  });
});
