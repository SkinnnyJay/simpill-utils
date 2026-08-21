/**
 * @file Tests for the Result combinator surface (Lumen Industries uplift):
 * map/mapErr/andThen/orElse/tap/tapErr/match, unwrap family, combine,
 * fromNullable, async chaining, and safeTry (Rust `?` emulation).
 */

import {
  andThen,
  andThenAsync,
  combine,
  combineWithAllErrors,
  err,
  fromNullable,
  fromThrowable,
  map,
  mapAsync,
  mapErr,
  match,
  ok,
  orElse,
  type Result,
  safeTry,
  safeTryAsync,
  safeUnwrap,
  tap,
  tapErr,
  unwrap,
  unwrapErr,
  unwrapOrElse,
} from "../../../src/shared/result";

describe("Result transform combinators", () => {
  it("map transforms Ok, passes Err through", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    const e: Result<number, string> = err("boom");
    expect(map(e, (n) => n * 2)).toBe(e);
  });

  it("mapErr transforms Err, passes Ok through", () => {
    const o: Result<number, string> = ok(1);
    expect(mapErr(o, (s) => s.toUpperCase())).toBe(o);
    expect(mapErr(err("boom"), (s) => s.toUpperCase())).toEqual(err("BOOM"));
  });

  it("andThen chains, short-circuits on Err (neverthrow semantics)", () => {
    const sq = (n: number): Result<number, number> => ok(n ** 2);
    expect(andThen(andThen(ok(2), sq), sq)).toEqual(ok(16));
    expect(andThen(andThen(ok(2), sq), (n: number) => err(n))).toEqual(err(4));
    expect(andThen(andThen(err(3) as Result<number, number>, sq), sq)).toEqual(err(3));
  });

  it("orElse recovers from Err, passes Ok through", () => {
    expect(orElse(err("x"), () => ok("default"))).toEqual(ok("default"));
    const o: Result<string, string> = ok("v");
    expect(orElse(o, () => ok("nope"))).toBe(o);
  });

  it("tap/tapErr run side effects without altering the result", () => {
    const seenOk: number[] = [];
    const seenErr: string[] = [];
    const o = ok(1);
    const e = err("bad");
    expect(
      tap(o, (v) => {
        seenOk.push(v);
      })
    ).toBe(o);
    expect(
      tapErr(e, (x) => {
        seenErr.push(x);
      })
    ).toBe(e);
    tap(e as Result<number, string>, (v) => {
      seenOk.push(v);
    });
    tapErr(o as Result<number, string>, (x) => {
      seenErr.push(x);
    });
    expect(seenOk).toEqual([1]);
    expect(seenErr).toEqual(["bad"]);
  });

  it("match is an exhaustive fold", () => {
    expect(
      match(
        ok(5),
        (v) => `ok:${v}`,
        (e) => `err:${e}`
      )
    ).toBe("ok:5");
    expect(
      match(
        err("x"),
        (v) => `ok:${v}`,
        (e) => `err:${e}`
      )
    ).toBe("err:x");
  });
});

describe("Result unwrap family", () => {
  it("unwrap returns Ok value, rethrows Error instances, wraps non-Errors with cause", () => {
    expect(unwrap(ok(7))).toBe(7);
    const boom = new Error("boom");
    expect(() => unwrap(err(boom))).toThrow(boom);
    try {
      unwrap(err("stringy"));
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error & { cause: unknown }).cause).toBe("stringy");
    }
  });

  it("unwrapErr returns the error, throws on Ok", () => {
    expect(unwrapErr(err("e"))).toBe("e");
    expect(() => unwrapErr(ok(1))).toThrow();
  });

  it("unwrapOrElse computes the fallback lazily from the error", () => {
    expect(unwrapOrElse(ok(1), () => 99)).toBe(1);
    expect(unwrapOrElse(err("e") as Result<number, string>, (e) => e.length)).toBe(1);
  });
});

describe("Result aggregation", () => {
  it("combine returns Ok(values) or the first Err", () => {
    expect(combine([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]));
    expect(combine([ok(1), err("first"), err("second")])).toEqual(err("first"));
    expect(combine([])).toEqual(ok([]));
  });

  it("combineWithAllErrors collects every error", () => {
    expect(combineWithAllErrors([ok(1), err("a"), err("b")])).toEqual(err(["a", "b"]));
    expect(combineWithAllErrors([ok(1), ok(2)])).toEqual(ok([1, 2]));
  });
});

describe("Result interop", () => {
  it("fromNullable", () => {
    expect(fromNullable(5, () => "nope")).toEqual(ok(5));
    expect(fromNullable(null, () => "nope")).toEqual(err("nope"));
    expect(fromNullable(undefined, () => "nope")).toEqual(err("nope"));
    expect(fromNullable(0, () => "nope")).toEqual(ok(0)); // falsy but present
  });

  it("fromThrowable with the new mapError parameter", () => {
    const r = fromThrowable(
      () => {
        throw new Error("raw");
      },
      (e) => `mapped:${(e as Error).message}`
    );
    expect(r).toEqual(err("mapped:raw"));
    // back-compat: single-arg form still returns the caught value untouched
    const legacy = fromThrowable(() => {
      throw "plain";
    });
    expect(legacy).toEqual(err("plain"));
  });
});

describe("Result async chaining", () => {
  it("mapAsync transforms Ok asynchronously", async () => {
    await expect(mapAsync(ok(2), async (n) => n * 3)).resolves.toEqual(ok(6));
    const e: Result<number, string> = err("boom");
    await expect(mapAsync(e, async (n) => n * 3)).resolves.toBe(e);
  });

  it("andThenAsync chains Promise<Result> linearly and short-circuits", async () => {
    const fetchN = async (): Promise<Result<number, string>> => ok(10);
    const double = async (n: number): Promise<Result<number, string>> => ok(n * 2);
    const fail = async (): Promise<Result<number, string>> => err("mid");
    await expect(andThenAsync(andThenAsync(fetchN(), double), double)).resolves.toEqual(ok(40));
    await expect(andThenAsync(andThenAsync(fetchN(), fail), double)).resolves.toEqual(err("mid"));
  });
});

describe("safeTry (Rust ? emulation)", () => {
  const parse = (s: string): Result<number, string> => {
    const n = Number(s);
    return Number.isNaN(n) ? err(`not a number: ${s}`) : ok(n);
  };

  it("unwraps Ok values and returns the body result", () => {
    const r = safeTry(function* () {
      const a = yield* safeUnwrap(parse("2"));
      const b = yield* safeUnwrap(parse("3"));
      return ok(a + b);
    });
    expect(r).toEqual(ok(5));
  });

  it("short-circuits on the first Err", () => {
    let reached = false;
    const r = safeTry(function* () {
      const a = yield* safeUnwrap(parse("2"));
      const b = yield* safeUnwrap(parse("oops"));
      reached = true;
      return ok(a + b);
    });
    expect(r).toEqual(err("not a number: oops"));
    expect(reached).toBe(false);
  });

  it("safeTryAsync supports awaits in the body", async () => {
    const fetchVal = async (): Promise<Result<number, string>> => ok(4);
    const r = await safeTryAsync(async function* () {
      const a = yield* safeUnwrap(await fetchVal());
      const b = yield* safeUnwrap(parse("6"));
      return ok(a * b);
    });
    expect(r).toEqual(ok(24));
    const r2 = await safeTryAsync(async function* () {
      const a = yield* safeUnwrap(await fetchVal());
      const b = yield* safeUnwrap(parse("nope"));
      return ok(a * b);
    });
    expect(r2).toEqual(err("not a number: nope"));
  });
});
