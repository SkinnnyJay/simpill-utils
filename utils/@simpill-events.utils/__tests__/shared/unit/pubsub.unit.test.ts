import { createPubSub, createTypedPubSub } from "../../../src/shared/pubsub.utils";

describe("PubSub", () => {
  it("subscribes and receives publish", () => {
    const ps = createPubSub<number>();
    const fn = jest.fn();
    ps.subscribe("ch", fn);
    ps.publish("ch", 1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("unsubscribe stops receiving", () => {
    const ps = createPubSub();
    const fn = jest.fn();
    const unsub = ps.subscribe("ch", fn);
    unsub();
    ps.publish("ch", 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("listenerCount returns count per channel and total", () => {
    const ps = createPubSub<number>();
    expect(ps.listenerCount()).toBe(0);
    ps.subscribe("a", () => {});
    ps.subscribe("a", () => {});
    ps.subscribe("b", () => {});
    expect(ps.listenerCount("a")).toBe(2);
    expect(ps.listenerCount("b")).toBe(1);
    expect(ps.listenerCount()).toBe(3);
  });

  it("clearChannel removes all subscribers for channel", () => {
    const ps = createPubSub<number>();
    const fn = jest.fn();
    ps.subscribe("ch", fn);
    ps.clearChannel("ch");
    ps.publish("ch", 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("clear removes all channels", () => {
    const ps = createPubSub<number>();
    const fn = jest.fn();
    ps.subscribe("ch", fn);
    ps.clear();
    ps.publish("ch", 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("onError is called when handler throws", () => {
    const onError = jest.fn();
    const ps = createPubSub<number>({ onError });
    ps.subscribe("ch", () => {
      throw new Error("boom");
    });
    ps.publish("ch", 1);
    expect(onError).toHaveBeenCalledWith("ch", expect.any(Error));
  });
});

describe("TypedPubSub", () => {
  type Channels = { news: string; count: number };

  it("subscribes and publishes with typed channels", () => {
    const ps = createTypedPubSub<Channels>();
    const onNews = jest.fn();
    const onCount = jest.fn();
    ps.subscribe("news", onNews);
    ps.subscribe("count", onCount);
    ps.publish("news", "hello");
    ps.publish("count", 42);
    expect(onNews).toHaveBeenCalledWith("hello");
    expect(onCount).toHaveBeenCalledWith(42);
  });

  it("listenerCount and clearChannel work", () => {
    const ps = createTypedPubSub<Channels>();
    ps.subscribe("news", () => {});
    ps.subscribe("news", () => {});
    expect(ps.listenerCount("news")).toBe(2);
    ps.clearChannel("news");
    expect(ps.listenerCount("news")).toBe(0);
  });
});
