import { AppError } from "../../../src/shared/app-error";

describe("AppError", () => {
  it("should create with message only", () => {
    const err = new AppError("fail");
    expect(err.message).toBe("fail");
    expect(err.name).toBe("AppError");
    expect(err.code).toBe("APP_ERROR");
    expect(err.meta).toEqual({});
    expect(err.cause).toBeUndefined();
  });

  it("should create with code, meta, and cause", () => {
    const cause = new Error("inner");
    const err = new AppError("fail", {
      code: "NOT_FOUND",
      meta: { id: 42 },
      cause,
    });
    expect(err.code).toBe("NOT_FOUND");
    expect(err.meta).toEqual({ id: 42 });
    expect(err.cause).toBe(cause);
  });

  it("should serialize to JSON", () => {
    const err = new AppError("fail", { code: "X", meta: { a: 1 } });
    expect(err.toJSON()).toEqual({
      name: "AppError",
      message: "fail",
      code: "X",
      meta: { a: 1 },
    });
  });

  it("should be instanceof Error", () => {
    const err = new AppError("fail");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
