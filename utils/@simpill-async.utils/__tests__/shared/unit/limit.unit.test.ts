import { createLimit, limitFunction } from "../../../src/shared/limit";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("createLimit", () => {
  it("limits concurrency", async () => {
    const limit = createLimit(2);
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await wait(10);
      active--;
      return true;
    };

    const results = await Promise.all([limit(task), limit(task), limit(task), limit(task)]);
    expect(results).toHaveLength(4);
    expect(maxActive).toBe(2);
  });

  it("tracks active and pending counts", async () => {
    const limit = createLimit(1);
    const task = async () => {
      await wait(10);
      return 1;
    };

    const promise = limit(task);
    const pending = limit(task);
    expect(limit.activeCount).toBe(1);
    expect(limit.pendingCount).toBe(1);

    await Promise.all([promise, pending]);
    expect(limit.activeCount).toBe(0);
    expect(limit.pendingCount).toBe(0);
  });

  it("rejects pending tasks on clear when configured", async () => {
    const limit = createLimit({ concurrency: 1, rejectOnClear: true });
    const task = async () => {
      await wait(10);
      return 1;
    };

    const running = limit(task);
    const pending = limit(task);
    pending.catch(() => undefined);
    limit.clearQueue();

    await expect(running).resolves.toBe(1);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("maps iterables with limit", async () => {
    const limit = createLimit(2);
    const results = await limit.map([1, 2, 3], async (value) => {
      await wait(5);
      return value * 2;
    });
    expect(results).toEqual([2, 4, 6]);
  });

  it("continues after synchronous throw", async () => {
    const limit = createLimit(1);
    const first = limit(async () => {
      throw new Error("boom");
    });
    const second = limit(async () => 2);

    await expect(first).rejects.toThrow("boom");
    await expect(second).resolves.toBe(2);
  });

  it("rejects when maxQueueSize exceeded (reject policy)", async () => {
    const limit = createLimit({ concurrency: 1, maxQueueSize: 1 });
    const task = async () => {
      await wait(20);
      return 1;
    };
    const first = limit(task);
    const second = limit(task);
    const third = limit(task);

    await expect(third).rejects.toMatchObject({ name: "OverflowError" });
    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(1);
  });

  it("drops oldest when maxQueueSize exceeded (drop_oldest policy)", async () => {
    const limit = createLimit({ concurrency: 1, maxQueueSize: 2, onOverflow: "drop_oldest" });
    const task = async (id: number) => {
      await wait(15);
      return id;
    };
    const a = limit(() => task(1));
    const b = limit(() => task(2));
    const c = limit(() => task(3));
    const d = limit(() => task(4));

    await expect(b).rejects.toMatchObject({ name: "OverflowError" });
    await expect(a).resolves.toBe(1);
    await expect(c).resolves.toBe(3);
    await expect(d).resolves.toBe(4);
  });

  it("rejects new task when maxQueueSize exceeded (drop_newest policy)", async () => {
    const limit = createLimit({ concurrency: 1, maxQueueSize: 1, onOverflow: "drop_newest" });
    const first = limit(async () => {
      await wait(20);
      return 1;
    });
    const second = limit(async () => 2);
    const third = limit(async () => 3);

    await expect(third).rejects.toMatchObject({ name: "OverflowError" });
    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
  });

  it("runWithOptions throws when signal already aborted", () => {
    const limit = createLimit(1);
    const controller = new AbortController();
    controller.abort();

    expect(() => limit.runWithOptions(async () => 1, { signal: controller.signal })).toThrow(
      /Operation aborted|AbortError/,
    );
  });
});

describe("limitFunction", () => {
  it("creates a limited function", async () => {
    const limited = limitFunction(async (value: number) => {
      await wait(5);
      return value + 1;
    }, 1);

    const results = await Promise.all([limited(1), limited(2)]);
    expect(results).toEqual([2, 3]);
  });
});
