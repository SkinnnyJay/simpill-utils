import { memoizeAsync } from "../../../src/shared/memoize-async";

describe("memoizeAsync", () => {
  it("caches resolved promises", async () => {
    let calls = 0;
    const fn = memoizeAsync(async (value: number) => {
      calls += 1;
      return value * 2;
    });

    await fn(2);
    await fn(2);
    expect(calls).toBe(1);
  });

  it("does not cache rejected promises by default", async () => {
    let calls = 0;
    const fn = memoizeAsync(async () => {
      calls += 1;
      throw new Error("nope");
    });

    await expect(fn()).rejects.toThrow("nope");
    await expect(fn()).rejects.toThrow("nope");
    expect(calls).toBe(2);
  });
});
