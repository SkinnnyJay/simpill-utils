import { AppError } from "../../../src/shared/app-error";
import { serializeError } from "../../../src/shared/serialize-error";

describe("serializeError", () => {
  it("should serialize AppError", () => {
    const err = new AppError("msg", { code: "X", meta: { a: 1 } });
    const out = serializeError(err);
    expect(out.name).toBe("AppError");
    expect(out.message).toBe("msg");
    expect(out.code).toBe("X");
    expect(out.meta).toEqual({ a: 1 });
  });

  it("should include stack when includeStack is true", () => {
    const err = new Error("msg");
    const out = serializeError(err, { includeStack: true });
    expect(out.stack).toBeDefined();
    expect(out.stack).toContain("msg");
  });

  it("should omit stack by default", () => {
    const err = new Error("msg");
    const out = serializeError(err);
    expect(out.stack).toBeUndefined();
  });

  it("should handle plain Error without code/meta", () => {
    const err = new Error("plain");
    const out = serializeError(err);
    expect(out.name).toBe("Error");
    expect(out.message).toBe("plain");
    expect(out.code).toBeUndefined();
    expect(out.meta).toBeUndefined();
  });

  it("should handle string thrown", () => {
    const out = serializeError("something went wrong");
    expect(out.name).toBe("Error");
    expect(out.message).toBe("something went wrong");
  });

  it("should handle unknown value", () => {
    const out = serializeError({ foo: 1 });
    expect(out.name).toBe("Error");
    expect(out.message).toBe("Unknown error");
  });

  it("should include cause chain when includeCause is true", () => {
    const inner = new Error("inner");
    const outer = Object.assign(new Error("outer"), { cause: inner });
    const out = serializeError(outer, { includeCause: true });
    expect(out.cause).toBeDefined();
    expect(out.cause?.name).toBe("Error");
    expect(out.cause?.message).toBe("inner");
  });

  it("should respect maxCauseDepth", () => {
    const e3 = new Error("third");
    const e2 = Object.assign(new Error("second"), { cause: e3 });
    const e1 = Object.assign(new Error("first"), { cause: e2 });
    const out = serializeError(e1, { includeCause: true, maxCauseDepth: 2 });
    expect(out.cause?.message).toBe("second");
    expect(out.cause?.cause?.message).toBe("third");
    expect(out.cause?.cause?.cause).toBeUndefined();
  });
});
