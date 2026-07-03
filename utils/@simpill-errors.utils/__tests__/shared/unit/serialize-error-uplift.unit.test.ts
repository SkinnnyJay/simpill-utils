import { AppError } from "../../../src/shared/app-error";
import {
  deserializeError,
  isError,
  isErrorLike,
  sanitizeForJson,
  serializeError,
} from "../../../src/shared/serialize-error";

type AnyRec = Record<string, unknown>;
const AggErr = (globalThis as AnyRec).AggregateError as new (
  errs: unknown[],
  m?: string
) => Error & { errors: unknown[] };

describe("serializeError uplift", () => {
  describe("JSON-safety (circular meta no longer throws)", () => {
    it("JSON.stringify never throws on circular meta", () => {
      const meta: AnyRec = { a: 1 };
      meta.self = meta;
      const out = serializeError(new AppError("boom", { meta }));
      expect(() => JSON.stringify(out)).not.toThrow();
      expect((out.meta as AnyRec).self).toBe("[Circular]");
      expect((out.meta as AnyRec).a).toBe(1);
    });

    it("bigint/symbol/function/Date/Map/Set in meta are sanitized to JSON-safe values", () => {
      const out = serializeError(
        new AppError("x", {
          meta: {
            big: BigInt(7),
            sym: Symbol("s"),
            fn: function namedFn() {},
            when: new Date("2026-07-03T00:00:00.000Z"),
            map: new Map([["k", "v"]]),
            set: new Set([1, 2]),
          },
        })
      );
      const meta = out.meta as AnyRec;
      expect(meta.big).toBe("7n");
      expect(meta.sym).toBe("Symbol(s)");
      expect(meta.fn).toBe("[Function: namedFn]");
      expect(meta.when).toBe("2026-07-03T00:00:00.000Z");
      expect(meta.map).toEqual({ k: "v" });
      expect(meta.set).toEqual([1, 2]);
      expect(() => JSON.stringify(out)).not.toThrow();
    });

    it("nested Error inside meta is flattened to name/message", () => {
      const out = serializeError(new AppError("x", { meta: { inner: new TypeError("t") } }));
      expect((out.meta as AnyRec).inner).toEqual({ name: "TypeError", message: "t" });
    });

    it("depth cap replaces overly deep values instead of recursing forever", () => {
      const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
      const sanitized = sanitizeForJson(deep, 3) as AnyRec;
      expect(JSON.stringify(sanitized)).toContain("[Object]");
    });
  });

  describe("circular cause chains are cycle-detected, not walked to the depth cap", () => {
    it("marks the revisited error as [Circular] immediately", () => {
      const e1 = new Error("one");
      const e2 = new Error("two");
      (e1 as unknown as AnyRec).cause = e2;
      (e2 as unknown as AnyRec).cause = e1;
      const out = serializeError(e1, { includeCause: true });
      expect(out.cause?.message).toBe("two");
      expect(out.cause?.cause?.message).toBe("[Circular]");
      expect(out.cause?.cause?.cause).toBeUndefined();
      expect(() => JSON.stringify(out)).not.toThrow();
    });

    it("self-caused error is cut", () => {
      const e = new Error("selfie");
      (e as unknown as AnyRec).cause = e;
      const out = serializeError(e, { includeCause: true });
      expect(out.cause?.message).toBe("[Circular]");
    });
  });

  describe("AggregateError support", () => {
    it("serializes inner errors", () => {
      const agg = new AggErr([new Error("a"), new AppError("b", { code: "X" })], "batch failed");
      const out = serializeError(agg);
      expect(out.name).toBe("AggregateError");
      expect(out.message).toBe("batch failed");
      expect(out.errors).toHaveLength(2);
      expect(out.errors?.[0].message).toBe("a");
      expect(out.errors?.[1].code).toBe("X");
    });

    it("nested aggregate + cause round-trips through JSON", () => {
      const agg = new AggErr([new Error("inner")], "outer");
      (agg as unknown as AnyRec).cause = new Error("why");
      const out = serializeError(agg, { includeCause: true, includeStack: true });
      const parsed = JSON.parse(JSON.stringify(out));
      expect(parsed.errors[0].message).toBe("inner");
      expect(parsed.cause.message).toBe("why");
    });
  });

  describe("extra own props preserved (Node system errors)", () => {
    it("errno/syscall/path land under props", () => {
      const err = Object.assign(new Error("ENOENT"), { errno: -2, syscall: "open", path: "/nope" });
      const out = serializeError(err);
      expect(out.props).toEqual({ errno: -2, syscall: "open", path: "/nope" });
    });

    it("circular extra props are sanitized, not thrown on", () => {
      const err = new Error("x") as Error & AnyRec;
      const loop: AnyRec = {};
      loop.loop = loop;
      err.extra = loop;
      const out = serializeError(err);
      expect(() => JSON.stringify(out)).not.toThrow();
      expect((out.props as AnyRec).extra).toEqual({ loop: "[Circular]" });
    });
  });

  describe("non-Error thrown values keep their identity", () => {
    it("numbers and booleans keep their value in message", () => {
      expect(serializeError(42).message).toBe("42");
      expect(serializeError(false).message).toBe("false");
    });

    it("error-like objects (cross-realm/postMessage shape) keep name, message, stack and code", () => {
      const errorLike = {
        name: "TypeError",
        message: "not a function",
        stack: "TypeError: not a function\n  at x",
        code: "E_TYPE",
      };
      const out = serializeError(errorLike, { includeStack: true });
      expect(out.name).toBe("TypeError");
      expect(out.message).toBe("not a function");
      expect(out.stack).toContain("not a function");
      expect(out.code).toBe("E_TYPE");
    });

    it("plain objects keep back-compat message but attach sanitized data", () => {
      const out = serializeError({ foo: 1 });
      expect(out.name).toBe("Error");
      expect(out.message).toBe("Unknown error");
      expect(out.data).toEqual({ foo: 1 });
    });
  });

  describe("isError / isErrorLike", () => {
    it("isError detects Error instances and subclasses", () => {
      expect(isError(new Error("x"))).toBe(true);
      expect(isError(new AppError("x"))).toBe(true);
      expect(isError(new TypeError("x"))).toBe(true);
      expect(isError("nope")).toBe(false);
      expect(isError({ name: "Error", message: "m" })).toBe(false);
    });

    it("isErrorLike accepts error-shaped plain objects", () => {
      expect(isErrorLike({ name: "Error", message: "m" })).toBe(true);
      expect(isErrorLike({ name: "Error" })).toBe(false);
      expect(isErrorLike(null)).toBe(false);
    });
  });

  describe("deserializeError (round trip)", () => {
    it("restores name, message, code, meta, stack, cause and errors", () => {
      const cause = new Error("root");
      const agg = new AggErr([new Error("i1")], "agg");
      (agg as unknown as AnyRec).cause = cause;
      Object.assign(agg, { code: "BATCH", meta: { n: 2 } });
      const wire = JSON.parse(
        JSON.stringify(serializeError(agg, { includeCause: true, includeStack: true }))
      );
      const revived = deserializeError(wire);
      expect(revived).toBeInstanceOf(Error);
      expect(revived.name).toBe("AggregateError");
      expect(revived.message).toBe("agg");
      expect((revived as unknown as AnyRec).code).toBe("BATCH");
      expect((revived as unknown as AnyRec).meta).toEqual({ n: 2 });
      expect(((revived as unknown as AnyRec).cause as Error).message).toBe("root");
      expect(((revived as unknown as AnyRec).errors as Error[])[0].message).toBe("i1");
      expect(revived.stack).toContain("agg");
    });

    it("props are restored without clobbering core fields", () => {
      const wire = {
        name: "Error",
        message: "m",
        props: { errno: -2, name: "EVIL", message: "evil" },
      };
      const revived = deserializeError(wire as never);
      expect(revived.message).toBe("m");
      expect((revived as unknown as AnyRec).errno).toBe(-2);
    });
  });
});
