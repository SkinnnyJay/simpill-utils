/**
 * @simpill/async.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  allWithLimit,
  anyFulfilled,
  createDeferred,
  createLimit,
  delay,
  filterAsync,
  mapAsync,
  mapSeries,
  promiseProps,
  raceWithTimeout,
  reduceAsync,
  reflect,
  retry,
  series,
  someFulfilled,
  timeAsync,
  timeoutResult,
  timeoutWithFallback,
} from "@simpill/async.utils";

async function main() {
  // Delay
  console.log("Waiting 100ms...");
  await delay(100);
  console.log("Done.");

  // Retry with backoff
  let attempts = 0;
  const result = await retry(
    async () => {
      attempts++;
      if (attempts < 2) throw new Error("Temporary failure");
      return "success";
    },
    { maxAttempts: 3, delayMs: 50, backoffMultiplier: 2 },
  );
  console.log("Retry result:", result);

  // Race with timeout
  const fast = await raceWithTimeout(Promise.resolve("ok"), 2000);
  console.log("Race result:", fast);

  // Concurrency limit
  const limit = createLimit(2);
  const tasks = [1, 2, 3, 4].map((value) =>
    limit(async () => {
      await delay(10);
      return value * 2;
    }),
  );
  const values = await Promise.all(tasks);
  console.log("Limited values:", values);

  // Deferred promise
  const deferred = createDeferred<string>();
  setTimeout(() => deferred.resolve("done"), 10);
  console.log("Deferred:", await deferred.promise);

  // Timing
  const timed = await timeAsync(async () => {
    await delay(5);
    return "ok";
  });
  console.log("Timed:", timed);

  // Reflect + timeoutResult
  const reflected = await reflect(Promise.resolve("value"));
  console.log("Reflected:", reflected);
  const timeouted = await timeoutResult(
    delay(20).then(() => "late"),
    5,
  );
  console.log("Timeout result:", timeouted);

  // any/some + series
  const any = await anyFulfilled([Promise.reject(new Error("fail")), Promise.resolve(5)]);
  console.log("Any:", any);
  const some = await someFulfilled(
    [Promise.resolve(1), Promise.resolve(2), Promise.reject(new Error("fail"))],
    2,
  );
  console.log("Some:", some);

  const serial = await series([async () => 1, async () => 2]);
  console.log("Series:", serial);

  const mapped = await mapSeries([1, 2, 3], async (value) => value * 2);
  console.log("MapSeries:", mapped);

  // allWithLimit + promiseProps
  const batched = await allWithLimit([async () => 1, async () => 2, async () => 3], {
    concurrency: 2,
  });
  console.log("AllWithLimit:", batched);

  const props = await promiseProps({ a: Promise.resolve(1), b: 2 });
  console.log("PromiseProps:", props);

  const filtered = await filterAsync([1, 2, 3, 4], async (value) => value % 2 === 0, {
    concurrency: 2,
  });
  console.log("FilterAsync:", filtered);

  const reduced = await reduceAsync([1, 2, 3], async (acc, value) => acc + value, 0);
  console.log("ReduceAsync:", reduced);

  const mappedLimited = await mapAsync([1, 2, 3, 4], async (value) => value * 3, {
    concurrency: 2,
  });
  console.log("MapAsync:", mappedLimited);

  const softTimeout = await timeoutWithFallback(
    delay(20).then(() => "late"),
    5,
    "fallback",
  );
  console.log("TimeoutWithFallback:", softTimeout);
}

main().catch(console.error);
