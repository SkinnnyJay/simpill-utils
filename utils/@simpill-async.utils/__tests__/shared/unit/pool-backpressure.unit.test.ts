import { anyFulfilled } from "../../../src/shared/any-some";
import { Semaphore } from "../../../src/shared/concurrency.utils";
import { delay } from "../../../src/shared/delay";
import { parallelMap, pool } from "../../../src/shared/parallel.utils";

describe("pool — backpressure (Lumen uplift)", () => {
  it("never pulls more than `concurrency` items ahead of completion", async () => {
    let pulled = 0;
    let maxLead = 0;
    let completed = 0;
    async function* source(): AsyncGenerator<number> {
      for (let i = 0; i < 100; i++) {
        pulled++;
        maxLead = Math.max(maxLead, pulled - completed);
        yield i;
      }
    }
    await pool(source(), 4, async (x) => {
      await delay(1);
      completed++;
      return x;
    });
    expect(pulled).toBe(100);
    // Old implementation drained all 100 immediately (maxLead = 100).
    expect(maxLead).toBeLessThanOrEqual(5);
  });

  it("returns results in source order", async () => {
    const results = await pool([30, 10, 20], 3, async (ms) => {
      await delay(ms);
      return ms;
    });
    expect(results).toEqual([30, 10, 20]);
  });

  it("stops pulling from the source after a task fails", async () => {
    let pulled = 0;
    async function* source(): AsyncGenerator<number> {
      for (let i = 0; i < 1000; i++) {
        pulled++;
        yield i;
      }
    }
    await expect(
      pool(source(), 2, async (x) => {
        if (x === 3) throw new Error("boom");
        await delay(1);
        return x;
      }),
    ).rejects.toThrow("boom");
    expect(pulled).toBeLessThan(20);
  });

  it("propagates iterator errors", async () => {
    async function* source(): AsyncGenerator<number> {
      yield 1;
      throw new Error("source-broke");
    }
    await expect(pool(source(), 2, async (x) => x)).rejects.toThrow("source-broke");
  });

  it("works with plain sync iterables", async () => {
    const results = await pool([1, 2, 3], 2, async (x) => x * 2);
    expect(results).toEqual([2, 4, 6]);
  });
});

describe("parallelMap — stop scheduling after failure (Lumen uplift)", () => {
  it("does not start new items once one has rejected", async () => {
    let started = 0;
    await expect(
      parallelMap(
        Array.from({ length: 50 }, (_, i) => i),
        async (x) => {
          started++;
          if (x === 0) throw new Error("first-fails");
          await delay(5);
          return x;
        },
        2,
      ),
    ).rejects.toThrow("first-fails");
    // Old implementation kept both workers chewing through all 50 items.
    await delay(30);
    expect(started).toBeLessThan(10);
  });
});

describe("anyFulfilled — native AggregateError (Lumen uplift)", () => {
  it("rejects with a real AggregateError instance carrying .errors", async () => {
    const a = new Error("a");
    const b = new Error("b");
    const rejection = await anyFulfilled([Promise.reject(a), Promise.reject(b)]).catch((e) => e);
    expect(rejection).toBeInstanceOf(AggregateError);
    expect(rejection.errors).toEqual([a, b]);
    expect(rejection.name).toBe("AggregateError");
  });
});

describe("Semaphore — tryAcquire / counters (Lumen uplift)", () => {
  it("tryAcquire takes a free permit and reports counters", async () => {
    const sem = new Semaphore(2);
    expect(sem.availablePermits).toBe(2);
    expect(sem.tryAcquire()).toBe(true);
    expect(sem.tryAcquire()).toBe(true);
    expect(sem.tryAcquire()).toBe(false);
    expect(sem.availablePermits).toBe(0);
    const waiter = sem.acquire();
    await delay(1);
    expect(sem.waitingCount).toBe(1);
    sem.release();
    await waiter;
    expect(sem.waitingCount).toBe(0);
    sem.release();
    sem.release();
    expect(sem.availablePermits).toBe(2);
  });
});

describe("delay — abort + unref (Lumen uplift)", () => {
  it("rejects with AbortError when signal aborts mid-wait", async () => {
    const controller = new AbortController();
    const p = delay(5000, { signal: controller.signal });
    setTimeout(() => controller.abort(), 10);
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects immediately on a pre-aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(delay(10, { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("resolves normally with unref: true", async () => {
    await expect(delay(5, { unref: true })).resolves.toBeUndefined();
  });
});
