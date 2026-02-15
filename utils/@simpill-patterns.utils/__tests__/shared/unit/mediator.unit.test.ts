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

  it("clears handlers and reports listener counts", () => {
    const mediator = createMediator<Events>();
    const handler = () => {};
    mediator.on("count", handler);
    expect(mediator.listenerCount("count")).toBe(1);

    mediator.clear();
    expect(mediator.listenerCount("count")).toBe(0);
  });
});
