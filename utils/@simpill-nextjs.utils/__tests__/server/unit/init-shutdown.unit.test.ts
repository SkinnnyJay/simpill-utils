import { createInitShutdown } from "../../../src/server/init-shutdown";

describe("createInitShutdown", () => {
  it("runs init callbacks in order", async () => {
    const order: number[] = [];
    const life = createInitShutdown();
    life.onInit(() => {
      order.push(1);
    });
    life.onInit(() => {
      order.push(2);
    });
    await life.init();
    expect(order).toEqual([1, 2]);
  });

  it("runs shutdown callbacks in order", async () => {
    const order: number[] = [];
    const life = createInitShutdown();
    life.onShutdown(() => {
      order.push(1);
    });
    life.onShutdown(() => {
      order.push(2);
    });
    await life.shutdown();
    expect(order).toEqual([1, 2]);
  });
});
