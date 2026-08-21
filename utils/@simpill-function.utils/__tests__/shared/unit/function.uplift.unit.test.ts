import {
  deleteAnnotation,
  getAnnotation,
  getAnnotations,
  hasAnnotation,
  setAnnotation,
} from "../../../src/shared/annotations.utils";
import { firstArg, lastArg } from "../../../src/shared/arguments.utils";
import { once } from "../../../src/shared/once";
import { compose, composeWith, pipe, pipeWith } from "../../../src/shared/pipe-compose";

describe("once (uplift)", () => {
  it("preserves `this`", () => {
    const obj = {
      value: 7,
      read: once(function (this: { value: number }) {
        return this.value;
      }),
    };
    expect(obj.read()).toBe(7);
  });

  it("REGRESSION: a throwing first call rethrows the same error afterwards", () => {
    // Old behavior: first call threw, every later call silently returned
    // `undefined` typed as TReturn — a type lie that hid init failures.
    const boom = new Error("init failed");
    const fn = jest.fn(() => {
      throw boom;
    });
    const o = once(fn);
    expect(() => o()).toThrow(boom);
    expect(() => o()).toThrow(boom);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("caches falsy results correctly", () => {
    const fn = jest.fn(() => 0);
    const o = once(fn);
    expect(o()).toBe(0);
    expect(o()).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("pipe/compose (uplift)", () => {
  const add1 = (x: number) => x + 1;
  const double = (x: number) => x * 2;

  it("empty pipe/compose are identity", () => {
    expect(pipe<number>()(5)).toBe(5);
    expect(compose<number>()(5)).toBe(5);
  });

  it.each([1, 2, 3, 4, 5, 8])("pipe order holds for %d functions (unrolled + loop paths)", (n) => {
    const fns = Array.from({ length: n }, (_, i) => (x: number) => x * 10 + i);
    const expected = fns.reduce<(x: number) => number>(
      (acc, fn) => (x) => fn(acc(x)),
      (x) => x,
    );
    expect(pipe(...fns)(1)).toBe(expected(1));
  });

  it.each([1, 2, 3, 4, 5, 8])("compose order holds for %d functions", (n) => {
    const fns = Array.from({ length: n }, (_, i) => (x: number) => x * 10 + i);
    const expected = fns.reduceRight<(x: number) => number>(
      (acc, fn) => (x) => fn(acc(x)),
      (x) => x,
    );
    expect(compose(...fns)(1)).toBe(expected(1));
  });

  it("compose does not mutate the input function array order", () => {
    const fns: Array<(x: number) => number> = [add1, double];
    compose(...fns);
    expect(fns[0]).toBe(add1);
    expect(fns[1]).toBe(double);
  });

  it("pipeWith infers across 12 type-changing functions (was capped at 4)", () => {
    const out: string = pipeWith(
      (x: number) => x + 1, // number
      (x: number) => `${x}`, // string
      (s: string) => s.length, // number
      (n: number) => n * 2, // number
      (n: number) => n > 0, // boolean
      (b: boolean) => (b ? 1 : 0), // number
      (n: number) => [n], // number[]
      (a: number[]) => a.length, // number
      (n: number) => ({ n }), // object
      (o: { n: number }) => o.n, // number
      (n: number) => n + 0.5, // number
      (n: number) => `v${n}`, // string
    )(41);
    expect(out).toBe("v1.5");
  });

  it("composeWith runs right-to-left with type changes", () => {
    const f = composeWith(
      (s: string) => s.length,
      (n: number) => `${n}${n}`,
      (x: number) => x + 1,
    );
    expect(f(4)).toBe(2); // 4 -> 5 -> "55" -> 2
  });
});

describe("annotations (uplift)", () => {
  it("reads on un-annotated targets behave correctly", () => {
    const target = {};
    expect(getAnnotation(target, "k")).toBeUndefined();
    expect(hasAnnotation(target, "k")).toBe(false);
    expect(getAnnotations(target)).toEqual({});
    expect(deleteAnnotation(target, "k")).toBe(false);
  });

  it("set/get/has/delete round-trip", () => {
    const target = {};
    setAnnotation(target, "a", 1);
    setAnnotation(target, "b", "two");
    expect(getAnnotation(target, "a")).toBe(1);
    expect(hasAnnotation(target, "b")).toBe(true);
    expect(getAnnotations(target)).toEqual({ a: 1, b: "two" });
    expect(deleteAnnotation(target, "a")).toBe(true);
    expect(hasAnnotation(target, "a")).toBe(false);
    expect(getAnnotations(target)).toEqual({ b: "two" });
  });

  it("re-annotating after deleting the last key works (map released + recreated)", () => {
    const target = {};
    setAnnotation(target, "k", 1);
    expect(deleteAnnotation(target, "k")).toBe(true);
    setAnnotation(target, "k", 2);
    expect(getAnnotation(target, "k")).toBe(2);
  });
});

describe("arguments (uplift)", () => {
  it("firstArg/lastArg work on arrays without copying", () => {
    expect(firstArg([1, 2, 3])).toBe(1);
    expect(lastArg([1, 2, 3])).toBe(3);
    expect(firstArg([])).toBeUndefined();
    expect(lastArg([])).toBeUndefined();
  });

  it("firstArg/lastArg work on IArguments", () => {
    function probe(..._xs: number[]): [number | undefined, number | undefined] {
      // biome-ignore lint/complexity/noArguments: intentionally exercising IArguments support
      return [firstArg<number>(arguments), lastArg<number>(arguments)];
    }
    expect(probe(9, 8, 7)).toEqual([9, 7]);
    expect(probe()).toEqual([undefined, undefined]);
  });
});
