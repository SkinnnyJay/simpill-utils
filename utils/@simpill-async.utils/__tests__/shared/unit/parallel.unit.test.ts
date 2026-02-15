import { parallelMap, pool } from "../../../src/shared/parallel.utils";

describe("parallelMap", () => {
  it("returns results in order", async () => {
    const results = await parallelMap([1, 2, 3], async (x) => x * 2, 2);
    expect(results).toEqual([2, 4, 6]);
  });

  it("throws AbortError when signal aborted before start", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      parallelMap([1, 2, 3], async (x) => x, 2, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("pool", () => {
  it("throws AbortError when signal aborted before iteration", async () => {
    const controller = new AbortController();
    controller.abort();

    async function* gen() {
      yield 1;
    }

    await expect(
      pool(gen(), 1, async () => 1, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
