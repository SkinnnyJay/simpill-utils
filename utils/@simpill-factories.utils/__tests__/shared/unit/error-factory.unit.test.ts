import { errorFactory } from "../../../src/shared/error-factory";

describe("errorFactory", () => {
  it("should create error with default message and code", () => {
    const create = errorFactory(Error, "Not found", "NOT_FOUND");
    const err = create();
    expect(err.message).toBe("Not found");
    expect((err as Error & { code?: string }).code).toBe("NOT_FOUND");
  });

  it("should allow overriding message and code", () => {
    const create = errorFactory(Error, "Not found", "NOT_FOUND");
    const err = create("User 123", "USER_NOT_FOUND");
    expect(err.message).toBe("User 123");
    expect((err as Error & { code?: string }).code).toBe("USER_NOT_FOUND");
  });

  it("should work without default code", () => {
    const create = errorFactory(Error, "Oops");
    const err = create();
    expect(err.message).toBe("Oops");
    expect((err as Error & { code?: string }).code).toBeUndefined();
  });
});
