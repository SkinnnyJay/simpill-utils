import { errorFactory } from "../../../src/shared/error-factory";

class HttpError extends Error {
  status = 500;
  constructor(message: string) {
    super(message);
    this.name = "HttpError";
  }
}

describe("errorFactory – subclass typing", () => {
  it("preserves the concrete subclass type and its fields", () => {
    const createHttp = errorFactory(HttpError, "Server error", "HTTP_ERROR");
    const err = createHttp();
    expect(err).toBeInstanceOf(HttpError);
    expect(err.name).toBe("HttpError");
    // typed without casts: status comes from HttpError, code from the factory
    expect(err.status).toBe(500);
    expect(err.code).toBe("HTTP_ERROR");
  });
});

describe("errorFactory – cause chaining (ES2022 convention)", () => {
  it("attaches options.cause to the produced error", () => {
    const createWrap = errorFactory(Error, "Operation failed", "OP_FAILED");
    const root = new Error("disk full");
    const err = createWrap(undefined, undefined, { cause: root });
    expect((err as Error & { cause?: unknown }).cause).toBe(root);
    expect(err.message).toBe("Operation failed");
    expect(err.code).toBe("OP_FAILED");
  });

  it("supports explicitly undefined cause when the key is present", () => {
    const create = errorFactory(Error, "x");
    const err = create(undefined, undefined, { cause: undefined });
    expect("cause" in err).toBe(true);
  });

  it("omits cause entirely when options are not given", () => {
    const create = errorFactory(Error, "x");
    expect("cause" in create()).toBe(false);
  });
});

describe("errorFactory – stack hygiene", () => {
  it("the wrapper frame is not the top of the stack (captureStackTrace path)", function thisTestFrame() {
    if (typeof Error.captureStackTrace !== "function") {
      return; // engines without captureStackTrace keep the default stack
    }
    const createNotFound = errorFactory(Error, "Not found", "NOT_FOUND");
    const err = createNotFound();
    const stack = err.stack ?? "";
    const lines = stack.split("\n");
    const firstFrame = lines.find((line) => line.trimStart().startsWith("at ")) ?? "";
    // the first frame must be THIS test, not error-factory SOURCE internals
    expect(firstFrame).not.toMatch(/src[\\/]shared[\\/]error-factory/);
    expect(firstFrame).toContain("error-factory.extended.unit.test");
  });
});

describe("errorFactory – frozen behavior pins", () => {
  it("keeps the (message?, code?) two-argument call shape working unchanged", () => {
    const create = errorFactory(Error, "Not found", "NOT_FOUND");
    const err = create("User 123", "USER_NOT_FOUND");
    expect(err.message).toBe("User 123");
    expect(err.code).toBe("USER_NOT_FOUND");
  });

  it("still leaves code undefined when neither default nor override is provided", () => {
    const create = errorFactory(Error, "Oops");
    expect(create().code).toBeUndefined();
  });
});

describe("errorFactory – cleanStack opt-out", () => {
  it("cleanStack:false skips the re-capture (wrapper frame stays, as frozen behavior)", () => {
    if (typeof Error.captureStackTrace !== "function") {
      return;
    }
    const create = errorFactory(Error, "hot path", undefined, { cleanStack: false });
    const err = create();
    const firstFrame =
      (err.stack ?? "").split("\n").find((line) => line.trimStart().startsWith("at ")) ?? "";
    expect(firstFrame).toMatch(/src[\\/]shared[\\/]error-factory/);
  });
});
