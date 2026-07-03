import { addCreatedAt, isNewerVersion, withNextVersion } from "../../../src/shared/data.lifecycle";
import {
  andThenResult,
  invalid,
  mapResult,
  refine,
  valid,
  validateArray,
  validateBoolean,
  validateEnum,
  validateNumber,
  validateString,
} from "../../../src/shared/data.validate";

describe("lifecycle uplift", () => {
  it("addCreatedAt preserves an existing createdAt (frozen ref destroyed the real creation time)", () => {
    const stamped = addCreatedAt({ createdAt: 1000, v: 1 });
    expect(stamped.createdAt).toBe(1000);
    expect(stamped.updatedAt).toBeGreaterThan(1000);
  });

  it("addCreatedAt stamps both when absent or invalid (original behavior)", () => {
    const fresh = addCreatedAt({ v: 1 });
    expect(fresh.createdAt).toBe(fresh.updatedAt);
    expect(typeof fresh.createdAt).toBe("number");
    const fixed = addCreatedAt({ createdAt: Number.NaN, v: 1 });
    expect(Number.isFinite(fixed.createdAt)).toBe(true);
  });

  it("withNextVersion recovers from NaN instead of propagating it forever", () => {
    expect(withNextVersion({ version: Number.NaN }).version).toBe(1);
    expect(withNextVersion({ version: 2 }).version).toBe(3);
    expect(withNextVersion({} as { version?: number }).version).toBe(1);
  });

  it("isNewerVersion treats non-finite versions as 0", () => {
    expect(isNewerVersion({ version: 1 }, { version: Number.NaN })).toBe(true);
    expect(isNewerVersion({ version: 2 }, { version: 1 })).toBe(true);
    expect(isNewerVersion({ version: 1 }, { version: 1 })).toBe(false);
  });
});

describe("validators uplift (de-punting the README's \"What we don't provide\")", () => {
  it("validateBoolean", () => {
    expect(validateBoolean(true)).toEqual({ ok: true, value: true });
    expect(validateBoolean("true").ok).toBe(false);
    expect(validateBoolean(1).ok).toBe(false);
  });

  it("validateArray without element validator", () => {
    expect(validateArray([1, 2])).toEqual({ ok: true, value: [1, 2] });
    expect(validateArray("nope").ok).toBe(false);
  });

  it("validateArray with element validator reports the failing index", () => {
    const ok = validateArray([1, 2, 3], validateNumber);
    expect(ok).toEqual({ ok: true, value: [1, 2, 3] });
    const bad = validateArray([1, "x", 3], validateNumber);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.message).toContain("index 1");
      expect(bad.message).toContain("Expected number");
    }
  });

  it("validateEnum narrows to the literal union with as const", () => {
    const r = validateEnum("draft", ["draft", "live"] as const);
    expect(r).toEqual({ ok: true, value: "draft" });
    const bad = validateEnum("gone", ["draft", "live"] as const);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toBe("Expected one of: draft, live");
    expect(validateEnum(2, [1, 2, 3] as const)).toEqual({ ok: true, value: 2 });
  });

  it("mapResult / andThenResult", () => {
    expect(mapResult(valid(2), (n) => n * 10)).toEqual({ ok: true, value: 20 });
    expect(mapResult(invalid("err"), (n) => n)).toEqual({ ok: false, message: "err" });
    expect(andThenResult(valid("5"), (s) => validateNumber(Number(s)))).toEqual({
      ok: true,
      value: 5,
    });
    expect(andThenResult(invalid("err"), () => valid(1))).toEqual({ ok: false, message: "err" });
  });

  it("refine wraps a validator with a predicate", () => {
    const validatePort = refine(validateNumber, (n) => n > 0 && n < 65536, "Expected port");
    expect(validatePort(8080)).toEqual({ ok: true, value: 8080 });
    expect(validatePort(70000)).toEqual({ ok: false, message: "Expected port" });
    expect(validatePort("x").ok).toBe(false);
  });

  it("refine composes: string then non-empty", () => {
    const nonEmpty = refine(validateString, (s) => s.length > 0, "Expected non-empty string");
    expect(nonEmpty("hi")).toEqual({ ok: true, value: "hi" });
    expect(nonEmpty("")).toEqual({ ok: false, message: "Expected non-empty string" });
  });
});
