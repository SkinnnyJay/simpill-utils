import { AppError } from "@simpill/errors.utils";
import {
  err,
  fromPromise,
  fromThrowable,
  isErr,
  isOk,
  ok,
  toResult,
  unwrapOr,
} from "../../../src/shared/result";

describe("result", () => {
  describe("ok / err", () => {
    it("should create ok with value", () => {
      const r = ok(42);
      expect(r.ok).toBe(true);
      expect((r as { value: number }).value).toBe(42);
    });

    it("should create err with error", () => {
      const e = new Error("x");
      const r = err(e);
      expect(r.ok).toBe(false);
      expect((r as { error: Error }).error).toBe(e);
    });
  });

  describe("isOk / isErr", () => {
    it("isOk returns true for ok", () => {
      expect(isOk(ok(1))).toBe(true);
      expect(isOk(err("x"))).toBe(false);
    });

    it("isErr returns true for err", () => {
      expect(isErr(err("x"))).toBe(true);
      expect(isErr(ok(1))).toBe(false);
    });
  });

  describe("unwrapOr", () => {
    it("returns value for ok", () => {
      expect(unwrapOr(ok(10), 0)).toBe(10);
    });

    it("returns fallback for err", () => {
      expect(unwrapOr(err("x"), 0)).toBe(0);
    });
  });

  describe("fromThrowable", () => {
    it("returns ok when fn does not throw", () => {
      const r = fromThrowable(() => 1);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(1);
    });

    it("returns err when fn throws", () => {
      const r = fromThrowable(() => {
        throw new Error("boom");
      });
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect((r.error as Error).message).toBe("boom");
    });
  });

  describe("toResult / fromPromise", () => {
    it("toResult returns ok for resolved promise", async () => {
      const r = await toResult(Promise.resolve(123));
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(123);
    });

    it("toResult returns err with AppError for rejected promise", async () => {
      const r = await toResult(Promise.reject(new Error("no")));
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error).toBeInstanceOf(AppError);
    });

    it("fromPromise returns ok when fn resolves", async () => {
      const r = await fromPromise(async () => "ok");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("ok");
    });
  });
});
