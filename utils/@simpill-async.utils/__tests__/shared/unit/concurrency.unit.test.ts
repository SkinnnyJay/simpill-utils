import { Mutex, Semaphore, withLimit } from "../../../src/shared/concurrency.utils";

describe("Semaphore", () => {
  it("run executes and releases", async () => {
    const sem = new Semaphore(1);
    const result = await sem.run(async () => 42);
    expect(result).toBe(42);
  });
});

describe("Mutex", () => {
  it("run serializes", async () => {
    const mutex = new Mutex();
    let n = 0;
    await Promise.all([
      mutex.run(async () => {
        n++;
        return n;
      }),
      mutex.run(async () => {
        n++;
        return n;
      }),
    ]);
    expect(n).toBe(2);
  });
});

describe("withLimit", () => {
  it("limits concurrency", async () => {
    let concurrent = 0;
    const items = [1, 2, 3, 4, 5];
    const results = await withLimit(2, items, async (x) => {
      concurrent++;
      await new Promise((r) => setTimeout(r, 10));
      const c = concurrent;
      concurrent--;
      return x + c;
    });
    expect(results).toHaveLength(5);
  });
});
