import { compose } from "../../../src/shared/compose";
import type { Middleware } from "../../../src/shared/types";

describe("compose", () => {
  it("runs middlewares in order and calls next at the end", async () => {
    const order: string[] = [];
    const m1: Middleware<{ id: number }, unknown> = (req, _res, next) => {
      order.push(`m1-${req.id}`);
      return next();
    };
    const m2: Middleware<{ id: number }, unknown> = (req, _res, next) => {
      order.push(`m2-${req.id}`);
      return next();
    };
    const m3: Middleware<{ id: number }, unknown> = (req, _res, next) => {
      order.push(`m3-${req.id}`);
      return next();
    };

    const stack = compose([m1, m2, m3]);
    const req = { id: 1 };
    const res = {};
    const next = (): void => {
      order.push("next");
    };

    await stack(req, res, next);

    expect(order).toEqual(["m1-1", "m2-1", "m3-1", "next"]);
  });

  it("stops when a middleware does not call next", async () => {
    const order: string[] = [];
    const m1: Middleware<unknown, unknown> = (_req, _res, next) => {
      order.push("m1");
      return next();
    };
    const m2: Middleware<unknown, unknown> = () => {
      order.push("m2");
    };
    const m3: Middleware<unknown, unknown> = (_req, _res, next) => {
      order.push("m3");
      return next();
    };

    const stack = compose([m1, m2, m3]);
    const next = (): void => {
      order.push("next");
    };

    await stack({}, {}, next);

    expect(order).toEqual(["m1", "m2"]);
  });

  it("handles empty array as no-op then next", async () => {
    const stack = compose([]);
    let nextCalls = 0;
    const next: () => void = () => {
      nextCalls += 1;
    };
    await stack({}, {}, next);
    expect(nextCalls).toBe(1);
  });
});
