import { BulkheadRejectedError, createBulkhead } from "../../../src/client/bulkhead";

describe("createBulkhead", () => {
  it("limits concurrency", async () => {
    const bulkhead = createBulkhead(2);
    const running: number[] = [];
    const fn = async (id: number) => {
      running.push(id);
      expect(running.length).toBeLessThanOrEqual(2);
      await new Promise((r) => setTimeout(r, 20));
      running.splice(running.indexOf(id), 1);
      return id;
    };
    const results = await Promise.all([
      bulkhead.run(() => fn(1)),
      bulkhead.run(() => fn(2)),
      bulkhead.run(() => fn(3)),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });
});

describe("createBulkhead uplift", () => {
  it("rejects immediately with BulkheadRejectedError when maxQueue is full", async () => {
    const bulkhead = createBulkhead(1, { maxQueue: 1 });
    let release: () => void = () => {};
    const running = bulkhead.run(
      () =>
        new Promise<number>((r) => {
          release = () => r(1);
        }),
    );
    const queued = bulkhead.run(() => Promise.resolve(2));
    const rejected = bulkhead.run(() => Promise.resolve(3));
    await expect(rejected).rejects.toBeInstanceOf(BulkheadRejectedError);
    await expect(rejected).rejects.toThrow("Bulkhead queue is full");
    release();
    await expect(running).resolves.toBe(1);
    await expect(queued).resolves.toBe(2);
  });

  it("aborting a queued call frees its queue slot", async () => {
    const bulkhead = createBulkhead(1, { maxQueue: 1 });
    let release: () => void = () => {};
    const running = bulkhead.run(
      () =>
        new Promise<number>((r) => {
          release = () => r(1);
        }),
    );
    const controller = new AbortController();
    const queued = bulkhead.run(() => Promise.resolve(2), { signal: controller.signal });
    controller.abort();
    await expect(queued).rejects.toThrow("Operation aborted.");
    // slot freed: a new call can queue instead of being rejected
    const requeued = bulkhead.run(() => Promise.resolve(3));
    release();
    await expect(running).resolves.toBe(1);
    await expect(requeued).resolves.toBe(3);
  });

  it("validates limit", () => {
    expect(() => createBulkhead(0)).toThrow("Bulkhead limit must be >= 1");
  });
});
