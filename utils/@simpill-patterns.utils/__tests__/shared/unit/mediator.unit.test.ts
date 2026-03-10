import { createMediator } from "../../../src/shared/mediator";

type Events = {
  ping: string;
  count: number;
};

describe("createMediator", () => {
  it("registers, emits, and unsubscribes handlers", () => {
    const mediator = createMediator<Events>();
    let received = "";

    const off = mediator.on("ping", (payload) => {
      received = payload;
    });

    mediator.emit("ping", "hello");
    expect(received).toBe("hello");

    off();
    mediator.emit("ping", "bye");
    expect(received).toBe("hello");
  });

  it("off and emit are no-op when event has no handlers", () => {
    const mediator = createMediator<Events>();
    const handler = () => {};
    mediator.off("ping", handler);
    expect(() => mediator.emit("ping", "nobody")).not.toThrow();
  });

  it("off removes handler when event has handlers", () => {
    const mediator = createMediator<Events>();
    let received = "";
    const handler = (p: string) => {
      received = p;
    };
    mediator.on("ping", handler);
    mediator.emit("ping", "one");
    expect(received).toBe("one");
    mediator.off("ping", handler);
    mediator.emit("ping", "two");
    expect(received).toBe("one");
  });

  it("clears handlers and reports listener counts", () => {
    const mediator = createMediator<Events>();
    const handler = () => {};
    mediator.on("count", handler);
    expect(mediator.listenerCount("count")).toBe(1);

    mediator.clear();
    expect(mediator.listenerCount("count")).toBe(0);
  });
});
