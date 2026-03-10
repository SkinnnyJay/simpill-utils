import { createBulkhead } from "../../../src/client/bulkhead";

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
