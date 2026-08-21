import { AppError, isAppError } from "../../../src/shared/app-error";

describe("AppError uplift", () => {
  it("cause is non-enumerable (native ES2022 semantics): no longer leaks via spread", () => {
    const err = new AppError("x", { cause: new Error("secret internals") });
    expect(err.cause).toBeInstanceOf(Error); // still accessible
    const spread = { ...err } as Record<string, unknown>;
    expect(spread.cause).toBeUndefined(); // no longer leaks
    expect(Object.prototype.propertyIsEnumerable.call(err, "cause")).toBe(false);
  });

  it("JSON.stringify(err) via toJSON stays exactly {name,message,code,meta}", () => {
    const err = new AppError("x", { code: "C", meta: { a: 1 }, cause: new Error("hidden") });
    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: "AppError",
      message: "x",
      code: "C",
      meta: { a: 1 },
    });
  });

  it("stack does not contain the AppError constructor frame (V8 captureStackTrace)", () => {
    const err = new AppError("frame check");
    expect(err.stack).not.toContain("new AppError");
  });

  describe("isAppError", () => {
    it("accepts real instances", () => {
      expect(isAppError(new AppError("x"))).toBe(true);
    });
    it("accepts cross-realm/deserialized duck-typed shapes", () => {
      expect(isAppError({ name: "AppError", code: "X", message: "m" })).toBe(true);
    });
    it("rejects plain errors and junk", () => {
      expect(isAppError(new Error("x"))).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError({ name: "AppError" })).toBe(false);
    });
  });
});
