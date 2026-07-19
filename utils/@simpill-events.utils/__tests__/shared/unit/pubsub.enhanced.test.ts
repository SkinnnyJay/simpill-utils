import { createPubSub, createTypedPubSub, ChannelWaitTimeoutError } from "../../../src/shared/pubsub.utils";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe("PubSub — publish re-entrancy safety", () => {
  it("a subscriber added during publish is NOT called this cycle", () => {
    const ps = createPubSub<number>();
    const calls: string[] = [];
    ps.subscribe("ch", () => {
      calls.push("A");
      ps.subscribe("ch", () => calls.push("B"));
    });
    ps.publish("ch", 1);
    expect(calls).toEqual(["A"]);
    ps.publish("ch", 2);
    expect(calls).toEqual(["A", "A", "B"]);
  });

  it("a subscriber removed during publish is skipped this cycle", () => {
    const ps = createPubSub<number>();
    const calls: string[] = [];
    const b = () => calls.push("B");
    let offB: () => void = () => {};
    ps.subscribe("ch", () => {
      calls.push("A");
      offB(); // remove b (registered after this handler) before it runs
    });
    offB = ps.subscribe("ch", b);
    ps.publish("ch", 1);
    expect(calls).toEqual(["A"]);
  });
});

describe("PubSub — subscribeOnce", () => {
  it("fires once then auto-unsubscribes", () => {
    const ps = createPubSub<number>();
    const fn = jest.fn();
    ps.subscribeOnce("ch", fn);
    ps.publish("ch", 1);
    ps.publish("ch", 2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
    expect(ps.listenerCount("ch")).toBe(0);
  });

  it("returned unsubscribe cancels before first message", () => {
    const ps = createPubSub<number>();
    const fn = jest.fn();
    const off = ps.subscribeOnce("ch", fn);
    off();
    ps.publish("ch", 1);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("PubSub — publishAsync", () => {
  it("serial awaits subscribers in order", async () => {
    const ps = createPubSub<number>();
    const order: string[] = [];
    ps.subscribe("ch", async () => {
      await delay(20);
      order.push("slow");
    });
    ps.subscribe("ch", () => {
      order.push("fast");
    });
    await ps.publishAsync("ch", 1);
    expect(order).toEqual(["slow", "fast"]);
  });

  it("rejects with AggregateError when multiple subscribers fail", async () => {
    const ps = createPubSub<number>();
    ps.subscribe("ch", () => Promise.reject(new Error("e1")));
    ps.subscribe("ch", () => {
      throw new Error("e2");
    });
    await expect(ps.publishAsync("ch", 1, { mode: "parallel" })).rejects.toBeInstanceOf(
      AggregateError,
    );
  });

  it("no-op on a channel with no subscribers", async () => {
    const ps = createPubSub<number>();
    await expect(ps.publishAsync("nope", 1)).resolves.toBeUndefined();
  });
});

describe("PubSub — waitFor", () => {
  it("resolves with the next message and cleans up", async () => {
    const ps = createPubSub<string>();
    const p = ps.waitFor("ch");
    ps.publish("ch", "hi");
    await expect(p).resolves.toBe("hi");
    expect(ps.listenerCount("ch")).toBe(0);
  });

  it("rejects on timeout with ChannelWaitTimeoutError", async () => {
    const ps = createPubSub<string>();
    await expect(ps.waitFor("ch", { timeout: 20 })).rejects.toBeInstanceOf(ChannelWaitTimeoutError);
    expect(ps.listenerCount("ch")).toBe(0);
  });

  it("rejects when aborted mid-wait", async () => {
    const ps = createPubSub<string>();
    const ac = new AbortController();
    const p = ps.waitFor("ch", { signal: ac.signal });
    ac.abort(new Error("stop"));
    await expect(p).rejects.toThrow("stop");
    expect(ps.listenerCount("ch")).toBe(0);
  });
});

describe("TypedPubSub — new methods parity", () => {
  type Channels = { news: string; count: number };

  it("subscribeOnce, publishAsync and waitFor work with typed channels", async () => {
    const ps = createTypedPubSub<Channels>();
    const once = jest.fn();
    ps.subscribeOnce("news", once);
    const waiting = ps.waitFor("count");
    await ps.publishAsync("news", "hello");
    ps.publish("count", 5);
    expect(once).toHaveBeenCalledWith("hello");
    await expect(waiting).resolves.toBe(5);
    ps.publish("news", "again");
    expect(once).toHaveBeenCalledTimes(1);
  });
});
