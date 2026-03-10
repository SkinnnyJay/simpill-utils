import { createQueue } from "../../../src/shared/queue";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("createQueue", () => {
  it("runs tasks with concurrency control", async () => {
    const queue = createQueue({ concurrency: 1 });
    const order: string[] = [];

    const first = queue.add(async () => {
      order.push("start-1");
      await wait(10);
      order.push("end-1");
      return 1;
    });
    const second = queue.add(async () => {
      order.push("start-2");
      return 2;
    });

    const results = await Promise.all([first, second]);
    expect(results).toEqual([1, 2]);
    expect(order).toEqual(["start-1", "end-1", "start-2"]);
  });

  it("resolves onIdle when queue is empty", async () => {
    const queue = createQueue({ concurrency: 1 });
    const work = queue.add(async () => {
      await wait(5);
    });
    await queue.onIdle();
    await work;
    expect(queue.size).toBe(0);
    expect(queue.activeCount).toBe(0);
  });

  it("rejects queued task when aborted before start", async () => {
    const queue = createQueue({ concurrency: 1 });
    const controller = new AbortController();

    const first = queue.add(async () => {
      await wait(20);
    });
    const second = queue.add(async () => 2, { signal: controller.signal });

    controller.abort();

    await expect(second).rejects.toMatchObject({ name: "AbortError" });
    await first;
  });

  it("continues after synchronous throw", async () => {
    const queue = createQueue({ concurrency: 1 });
    const first = queue.add(async () => {
      throw new Error("boom");
    });
    const second = queue.add(async () => 2);

    await expect(first).rejects.toThrow("boom");
    await expect(second).resolves.toBe(2);
  });

  it("rejects add when maxQueueSize exceeded (reject)", async () => {
    const queue = createQueue({ concurrency: 1, maxQueueSize: 1 });
    const slow = queue.add(async () => {
      await wait(30);
      return 1;
    });
    const second = queue.add(async () => 2);
    const third = queue.add(async () => 3);

    await expect(third).rejects.toMatchObject({ name: "OverflowError" });
    await expect(slow).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
  });

  it("drops oldest when maxQueueSize exceeded (drop_oldest)", async () => {
    const queue = createQueue({ concurrency: 1, maxQueueSize: 2, onOverflow: "drop_oldest" });
    const a = queue.add(async () => {
      await wait(20);
      return "a";
    });
    const b = queue.add(async () => "b");
    const c = queue.add(async () => "c");
    const d = queue.add(async () => "d");

    await expect(b).rejects.toMatchObject({ name: "OverflowError" });
    await expect(a).resolves.toBe("a");
    await expect(c).resolves.toBe("c");
    await expect(d).resolves.toBe("d");
  });
});
