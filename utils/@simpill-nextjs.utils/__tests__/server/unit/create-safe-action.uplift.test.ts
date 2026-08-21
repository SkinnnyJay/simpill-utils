/** @file createSafeAction uplift: framework-error rethrow, outputSchema, FormData, onError */
import { z } from "zod";
import { createSafeAction, isNextFrameworkError } from "../../../src/server/create-safe-action";

const redirectError = (url: string) =>
  Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;push;${url};307;` });
const notFoundError = () =>
  Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), {
    digest: "NEXT_HTTP_ERROR_FALLBACK;404",
  });

describe("Next.js framework error rethrow", () => {
  it("rethrows redirect() so navigation works inside handlers (vercel/next.js#49298 class)", async () => {
    const action = createSafeAction(z.object({}), async () => {
      throw redirectError("/dashboard");
    });
    await expect(action({})).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;push;/dashboard;307;",
    });
  });

  it("rethrows notFound()/unauthorized()/forbidden() (NEXT_HTTP_ERROR_FALLBACK) and legacy NEXT_NOT_FOUND", async () => {
    const nf = createSafeAction(z.object({}), async () => {
      throw notFoundError();
    });
    await expect(nf({})).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });

    const legacy = createSafeAction(z.object({}), async () => {
      throw Object.assign(new Error("NEXT_NOT_FOUND"), { digest: "NEXT_NOT_FOUND" });
    });
    await expect(legacy({})).rejects.toMatchObject({ digest: "NEXT_NOT_FOUND" });
  });

  it("application errors are still returned as data, not thrown", async () => {
    const action = createSafeAction(z.object({}), async () => {
      throw new Error("db failed");
    });
    const result = await action({});
    expect(result.error?.message).toBe("db failed");
  });

  it("isNextFrameworkError: digest-prefix detection, no false positives", () => {
    expect(isNextFrameworkError(redirectError("/x"))).toBe(true);
    expect(isNextFrameworkError(notFoundError())).toBe(true);
    expect(isNextFrameworkError({ digest: "DYNAMIC_SERVER_USAGE" })).toBe(true);
    expect(isNextFrameworkError({ digest: "BAILOUT_TO_CLIENT_SIDE_RENDERING" })).toBe(true);
    expect(isNextFrameworkError(new Error("NEXT_REDIRECT"))).toBe(false); // message alone is not a digest
    expect(isNextFrameworkError({ digest: "NEXT_REDIRECTED" })).toBe(false); // prefix must be exact or ;-delimited
    expect(isNextFrameworkError({ digest: 42 })).toBe(false);
    expect(isNextFrameworkError(null)).toBe(false);
    expect(isNextFrameworkError("NEXT_REDIRECT")).toBe(false);
  });
});

describe("outputSchema (previously a dead option)", () => {
  it("rejects invalid handler output with a generic error (no server data echoed)", async () => {
    const onError = jest.fn();
    const action = createSafeAction(
      z.object({}),
      async () => ({ id: 123 }) as unknown as { id: string },
      { outputSchema: z.object({ id: z.string() }), onError }
    );
    const result = await action({});
    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      message: "Output validation failed",
      code: "OUTPUT_VALIDATION_ERROR",
    });
    expect(JSON.stringify(result)).not.toContain("123"); // server value not leaked
    expect(onError).toHaveBeenCalledTimes(1); // observability hook sees the ZodError
  });

  it("applies output transforms", async () => {
    const action = createSafeAction(z.object({}), async () => ({ name: "  jay  " }), {
      outputSchema: z.object({ name: z.string().transform((s) => s.trim()) }),
    });
    const result = await action({});
    expect(result.data).toEqual({ name: "jay" });
  });
});

describe("FormData input", () => {
  const Schema = z.object({ name: z.string().min(1), count: z.coerce.number().int() });

  it("form-posted FormData validates against plain-object schemas", async () => {
    const fd = new FormData();
    fd.append("name", "jay");
    fd.append("count", "3");
    fd.append("$ACTION_ID_abc123", "internal"); // Next.js internal field must be dropped
    const action = createSafeAction(Schema, async (input) => input);
    const result = await action(fd);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ name: "jay", count: 3 });
  });

  it("repeated FormData fields become arrays", async () => {
    const fd = new FormData();
    fd.append("tags", "a");
    fd.append("tags", "b");
    const action = createSafeAction(z.object({ tags: z.array(z.string()) }), async (i) => i);
    const result = await action(fd);
    expect(result.data).toEqual({ tags: ["a", "b"] });
  });

  it("schemas validating FormData instances directly still work (raw parse runs first)", async () => {
    const fd = new FormData();
    fd.append("x", "1");
    const action = createSafeAction(z.instanceof(FormData), async (input) => input.get("x"));
    const result = await action(fd);
    expect(result.data).toBe("1");
  });

  it("invalid FormData still returns the validation error shape", async () => {
    const fd = new FormData();
    fd.append("count", "not-a-number");
    const action = createSafeAction(Schema, async (i) => i);
    const result = await action(fd);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.validation).toBeDefined();
  });
});

describe("onError hook", () => {
  it("fires for handler throws, not for framework errors or input validation", async () => {
    const onError = jest.fn();
    const throwing = createSafeAction(
      z.object({}),
      async () => {
        throw new Error("boom");
      },
      { onError }
    );
    await throwing({});
    expect(onError).toHaveBeenCalledTimes(1);

    onError.mockClear();
    const redirecting = createSafeAction(
      z.object({}),
      async () => {
        throw redirectError("/x");
      },
      { onError }
    );
    await redirecting({}).catch(() => {});
    expect(onError).not.toHaveBeenCalled();

    onError.mockClear();
    const invalid = createSafeAction(z.object({ n: z.number() }), async (i) => i, { onError });
    await invalid({ n: "nope" });
    expect(onError).not.toHaveBeenCalled();
  });
});
