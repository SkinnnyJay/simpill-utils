/**
 * Resilience uplift benchmarks (run: npm run build && node benchmarks/resilience.bench.mjs)
 * 1. Boundary-burst: fixed window vs token bucket admission across a window edge.
 * 2. CircuitBreaker happy-path overhead vs opossum (if installed: npm i --no-save opossum).
 */
import { CircuitBreaker, RateLimiter, TokenBucketRateLimiter } from "../dist/index.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boundaryBurst() {
  const LIMIT = 50;
  const WINDOW = 200;

  // Fixed window: saturate the tail of window 1, then the head of window 2.
  const fixed = new RateLimiter({ maxRequests: LIMIT, windowMs: WINDOW });
  let fixedAdmitted = 0;
  await fixed.run(async () => {
    fixedAdmitted++;
  }); // opens window at t0
  await sleep(WINDOW - 40); // move near the boundary
  const jobs = [];
  const fc = { n: 0 };
  for (let i = 0; i < LIMIT * 2; i++) {
    jobs.push(
      fixed
        .run(async () => {
          fc.n++;
        })
        .catch(() => {}),
    );
  }
  await Promise.race([Promise.allSettled(jobs), sleep(80)]); // 80ms straddle
  fixedAdmitted += fc.n;

  const bucket = new TokenBucketRateLimiter({
    capacity: LIMIT,
    refillPerSecond: LIMIT * (1000 / WINDOW),
  });
  bucket.tryAcquire(); // same "earlier traffic"
  await sleep(WINDOW - 40);
  let bucketAdmitted = 1;
  const t0 = Date.now();
  while (Date.now() - t0 < 80) {
    if (bucket.tryAcquire()) bucketAdmitted++;
  }
  console.log(`Boundary straddle (~80ms, limit ${LIMIT}/${WINDOW}ms):`);
  console.log(`  fixed window admitted : ${fixedAdmitted}`);
  console.log(`  token bucket admitted : ${bucketAdmitted}`);
}

async function breakerOverhead() {
  const N = 200_000;
  const fn = () => Promise.resolve(1);
  const cb = new CircuitBreaker();
  for (let i = 0; i < 10_000; i++) await cb.run(fn); // warmup
  let t = process.hrtime.bigint();
  for (let i = 0; i < N; i++) await cb.run(fn);
  const oursNs = Number(process.hrtime.bigint() - t) / N;
  console.log(
    `CircuitBreaker.run happy path: ${oursNs.toFixed(0)} ns/op (${(1e9 / oursNs / 1e6).toFixed(2)} M ops/s)`,
  );

  try {
    const { default: Opossum } = await import("opossum");
    const breaker = new Opossum(fn, { timeout: false });
    for (let i = 0; i < 10_000; i++) await breaker.fire();
    t = process.hrtime.bigint();
    for (let i = 0; i < N; i++) await breaker.fire();
    const theirsNs = Number(process.hrtime.bigint() - t) / N;
    console.log(
      `opossum fire happy path      : ${theirsNs.toFixed(0)} ns/op (${(1e9 / theirsNs / 1e6).toFixed(2)} M ops/s)`,
    );
    console.log(`ratio: ${(theirsNs / oursNs).toFixed(2)}x`);
  } catch {
    console.log("(opossum not installed; skipping comparison)");
  }
}

await boundaryBurst();
await breakerOverhead();
