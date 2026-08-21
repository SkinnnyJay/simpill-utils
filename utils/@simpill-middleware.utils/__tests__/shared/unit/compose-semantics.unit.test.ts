import { compose } from "../../../src/shared/compose";
import type { Middleware, Next } from "../../../src/shared/types";

describe("compose — error propagation (Express semantics)", () => {
  it("next(err) short-circuits remaining middlewares and forwards err to terminal next", async () => {
    const order: string[] = [];
    const boom = new Error("boom");
    const m1: Middleware<unknown, unknown> = (_q, _s, next) => {
      order.push("m1");
      return next(boom);
    };
    const m2: Middleware<unknown, unknown> = (_q, _s, next) => {
      order.push("m2");
      return next();
    };
    let terminalArg: unknown = "unset";
    const terminal: Next = (err?: unknown) => {
      terminalArg = err;
    };

    await compose([m1, m2])({}, {}, terminal);

    expect(order).toEqual(["m1"]);
    expect(terminalArg).toBe(boom);
  });

  it("forwards Express router sentinels like next('route') to the terminal next", async () => {
    const order: string[] = [];
    const m1: Middleware<unknown, unknown> = (_q, _s, next) => next("route");
    const m2: Middleware<unknown, unknown> = (_q, _s, next) => {
      order.push("m2");
      return next();
    };
    let terminalArg: unknown;
    await compose([m1, m2])({}, {}, (err?: unknown) => {
      terminalArg = err;
    });
    expect(order).toEqual([]);
    expect(terminalArg).toBe("route");
  });

  it("treats falsy next arguments as success (next(null)/next(undefined) continue the chain)", async () => {
    const order: string[] = [];
    const m1: Middleware<unknown, unknown> = (_q, _s, next) => next(null);
    const m2: Middleware<unknown, unknown> = (_q, _s, next) => {
      order.push("m2");
      return next(undefined);
    };
    let terminalArg: unknown = "unset";
    await compose([m1, m2])({}, {}, (err?: unknown) => {
      terminalArg = err;
    });
    expect(order).toEqual(["m2"]);
    expect(terminalArg).toBeUndefined();
  });

  it("propagates async middleware rejections through the returned promise", async () => {
    const m1: Middleware<unknown, unknown> = async (_q, _s, next) => {
      await next();
    };
    const m2: Middleware<unknown, unknown> = async () => {
      throw new Error("async-boom");
    };
    await expect(Promise.resolve(compose([m1, m2])({}, {}, () => undefined))).rejects.toThrow(
      "async-boom",
    );
  });

  it("lets synchronous throws propagate synchronously (Express 4 try/catch compatibility)", () => {
    const m1: Middleware<unknown, unknown> = () => {
      throw new Error("sync-boom");
    };
    expect(() => compose([m1])({}, {}, () => undefined)).toThrow("sync-boom");
  });
});

describe("compose — next() called multiple times guard", () => {
  it("rejects instead of invoking the terminal next twice", async () => {
    let terminalCalls = 0;
    const m1: Middleware<unknown, unknown> = async (_q, _s, next) => {
      await next();
      await next();
    };
    await expect(
      Promise.resolve(
        compose([m1])({}, {}, () => {
          terminalCalls += 1;
        }),
      ),
    ).rejects.toThrow("next() called multiple times");
    expect(terminalCalls).toBe(1);
  });

  it("does not re-execute downstream middlewares on a duplicate next()", async () => {
    const order: string[] = [];
    const m1: Middleware<unknown, unknown> = async (_q, _s, next) => {
      order.push("m1");
      await next();
      await next();
    };
    const m2: Middleware<unknown, unknown> = (_q, _s, next) => {
      order.push("m2");
      return next();
    };
    await expect(
      Promise.resolve(
        compose([m1, m2])({}, {}, () => {
          order.push("terminal");
        }),
      ),
    ).rejects.toThrow("next() called multiple times");
    expect(order).toEqual(["m1", "m2", "terminal"]);
  });
});

describe("compose — input validation and snapshotting", () => {
  it("throws TypeError at compose time for non-array input", () => {
    // @ts-expect-error deliberate misuse
    expect(() => compose("nope")).toThrow(TypeError);
  });

  it("throws TypeError at compose time when an element is not a function", () => {
    // @ts-expect-error deliberate misuse
    expect(() => compose([() => undefined, 42])).toThrow(TypeError);
  });

  it("snapshots the middleware array: later mutation does not change the chain", async () => {
    const order: string[] = [];
    const mws: Middleware<unknown, unknown>[] = [
      (_q, _s, next) => {
        order.push("m1");
        return next();
      },
    ];
    const stack = compose(mws);
    mws.push((_q, _s, next) => {
      order.push("m2-added-later");
      return next();
    });
    await stack({}, {}, () => {
      order.push("terminal");
    });
    expect(order).toEqual(["m1", "terminal"]);
  });

  it("supports nested composed stacks", async () => {
    const order: string[] = [];
    const tag =
      (name: string): Middleware<unknown, unknown> =>
      (_q, _s, next) => {
        order.push(name);
        return next();
      };
    const inner = compose([tag("i1"), tag("i2")]);
    const outer = compose([tag("o1"), inner, tag("o2")]);
    await outer({}, {}, () => {
      order.push("terminal");
    });
    expect(order).toEqual(["o1", "i1", "i2", "o2", "terminal"]);
  });

  it("propagates next(err) from a nested composed stack to the outermost terminal", async () => {
    const boom = new Error("nested-boom");
    const inner = compose<unknown, unknown>([(_q, _s, next) => next(boom)]);
    const afterInner: Middleware<unknown, unknown> = jest.fn((_q, _s, next) => next());
    let terminalArg: unknown;
    await compose([inner, afterInner])({}, {}, (err?: unknown) => {
      terminalArg = err;
    });
    expect(terminalArg).toBe(boom);
    expect(afterInner).not.toHaveBeenCalled();
  });
});
