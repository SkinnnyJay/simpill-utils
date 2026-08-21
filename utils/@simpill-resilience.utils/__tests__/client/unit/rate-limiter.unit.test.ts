import { RateLimiter } from "../../../src/client/rate-limiter";

describe("RateLimiter", () => {
  it("allows up to maxRequests in a window", async () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
    const one = await limiter.run(() => Promise.resolve(1));
    const two = await limiter.run(() => Promise.resolve(2));
    expect(one).toBe(1);
    expect(two).toBe(2);
  });

  it("delays when over limit", async () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });
    const results: number[] = [];
    const p1 = limiter.run(async () => {
      results.push(1);
      await new Promise((r) => setTimeout(r, 10));
      return 1;
    });
    const p2 = limiter.run(async () => {
      results.push(2);
      return 2;
    });
    await Promise.all([p1, p2]);
    expect(results).toEqual([1, 2]);
  });
});

describe("RateLimiter uplift", () => {
  it("abort interrupts the window wait immediately", async () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 5000 });
    await limiter.run(() => Promise.resolve(1));
    const controller = new AbortController();
    const started = Date.now();
    const pending = limiter.run(() => Promise.resolve(2), { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await expect(pending).rejects.toThrow("Operation aborted.");
    // pre-fix this waited the full 5s window before noticing the abort
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
