import { TokenBucketRateLimiter } from "../../../src/client/token-bucket";

describe("TokenBucketRateLimiter", () => {
  it("allows an initial burst up to capacity", async () => {
    const limiter = new TokenBucketRateLimiter({ capacity: 3, refillPerSecond: 1 });
    const results = await Promise.all([
      limiter.run(() => Promise.resolve(1)),
      limiter.run(() => Promise.resolve(2)),
      limiter.run(() => Promise.resolve(3)),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  it("tryAcquire returns false when empty and true after refill", async () => {
    const limiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 20 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(limiter.tryAcquire()).toBe(true);
  });

  it("waits for refill when tokens are exhausted", async () => {
    const limiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 20 });
    const start = Date.now();
    await limiter.run(() => Promise.resolve(1));
    await limiter.run(() => Promise.resolve(2));
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });

  it("never admits more than capacity + refill across a boundary (no 2x burst)", async () => {
    // Fixed window with maxRequests=10/100ms admits up to 20 in a 100ms
    // straddle; the bucket is capped at capacity + elapsed*rate.
    const limiter = new TokenBucketRateLimiter({ capacity: 10, refillPerSecond: 100 });
    let admitted = 0;
    const start = Date.now();
    while (Date.now() - start < 100) {
      if (limiter.tryAcquire()) admitted++;
    }
    const elapsedSec = (Date.now() - start) / 1000;
    expect(admitted).toBeLessThanOrEqual(Math.ceil(10 + elapsedSec * 100) + 1);
  });

  it("rejects with AbortError immediately when signal aborts mid-wait", async () => {
    const limiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 0.1 });
    await limiter.run(() => Promise.resolve(1));
    const controller = new AbortController();
    const started = Date.now();
    const pending = limiter.run(() => Promise.resolve(2), { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await expect(pending).rejects.toThrow("Operation aborted.");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("validates options", () => {
    expect(() => new TokenBucketRateLimiter({ capacity: 0, refillPerSecond: 1 })).toThrow();
    expect(() => new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 0 })).toThrow();
  });
});
