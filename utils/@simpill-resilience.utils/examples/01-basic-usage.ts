/**
 * @simpill/resilience.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { CircuitBreaker, createBulkhead, RateLimiter, withJitter } from "@simpill/resilience.utils";

async function main() {
  // Circuit breaker: stop calling after N failures
  const cb = new CircuitBreaker({ failureThreshold: 3, openMs: 5000 });
  const result = await cb.run(async () => "ok");
  console.log("CircuitBreaker run:", result);
  console.log("CircuitBreaker state:", cb.getState());

  // Rate limiter: max N requests per window
  const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });
  await limiter.run(async () => "first");
  await limiter.run(async () => "second");
  console.log("RateLimiter: two runs within window succeeded");

  // Bulkhead: limit concurrent executions
  const bulkhead = createBulkhead(2);
  await Promise.all([bulkhead.run(async () => "a"), bulkhead.run(async () => "b")]);
  console.log("Bulkhead: two concurrent runs succeeded");

  // Jitter: randomize delay for backoff
  const delayMs = withJitter(1000, { factor: 0.2, maxMs: 2000 });
  console.log("withJitter(1000):", delayMs, "ms");
}

main().catch(console.error);
