import { createMethodProxy } from "../../../src/shared/proxy";

describe("createMethodProxy", () => {
  it("calls hooks around method invocations", () => {
    const target = {
      add: (a: number, b: number) => a + b,
    } as Record<string, (...args: unknown[]) => unknown>;

    const events: string[] = [];
    const proxy = createMethodProxy(target, {
      before: (method, args) => {
        events.push(`before:${String(method)}:${args.join(",")}`);
      },
      after: (method, _args, result) => {
        events.push(`after:${String(method)}:${result}`);
      },
    });

    expect(proxy.add(1, 2)).toBe(3);
    expect(events).toEqual(["before:add:1,2", "after:add:3"]);
  });

  it("routes errors to hook", () => {
    const target = {
      fail: () => {
        throw new Error("boom");
      },
    } as Record<string, (...args: unknown[]) => unknown>;

    let message = "";
    const proxy = createMethodProxy(target, {
      error: (_method, _args, error) => {
        if (error instanceof Error) message = error.message;
      },
    });

    expect(() => proxy.fail()).toThrow("boom");
    expect(message).toBe("boom");
  });
});
