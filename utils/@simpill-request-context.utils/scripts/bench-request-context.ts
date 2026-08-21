/* Benchmark: run with `npx tsx scripts/bench-request-context.ts` (Node 22+). */
import { AsyncLocalStorage } from "node:async_hooks";
import { getRequestContext, runWithRequestContext, runWithRequestContextSync } from "../src/server";

const N = 1_000_000;

function benchSync(name: string, fn: () => void): number {
  fn(); // warm
  const t0 = process.hrtime.bigint();
  fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`${name}: ${ms.toFixed(1)}ms (${(((N / ms) * 1000) / 1e6).toFixed(2)}M ops/s)`);
  return ms;
}

async function benchAsync(name: string, fn: () => Promise<void>): Promise<number> {
  await fn(); // warm
  const t0 = process.hrtime.bigint();
  await fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`${name}: ${ms.toFixed(1)}ms (${(((N / ms) * 1000) / 1e6).toFixed(2)}M ops/s)`);
  return ms;
}

async function main() {
  const ctx = { requestId: "bench" };
  let sink = 0;

  // 1) sync run: new runWithRequestContextSync vs old always-async runWithRequestContext
  const syncMs = benchSync(`runWithRequestContextSync x${N}`, () => {
    for (let i = 0; i < N; i++) {
      sink += runWithRequestContextSync(ctx, () => 1);
    }
  });
  const asyncMs = await benchAsync(`runWithRequestContext (await) x${N}`, async () => {
    for (let i = 0; i < N; i++) {
      sink += await runWithRequestContext(ctx, () => 1);
    }
  });
  console.log(`  -> sync path is ${(asyncMs / syncMs).toFixed(2)}x faster for sync fns\n`);

  // 2) getRequestContext (global-registry default store) vs raw ALS getStore — parity check
  const als = new AsyncLocalStorage<{ requestId: string }>();
  runWithRequestContextSync(ctx, () => {
    als.run(ctx, () => {
      const wrapMs = benchSync(`getRequestContext x${N}`, () => {
        for (let i = 0; i < N; i++) {
          if (getRequestContext() !== undefined) sink++;
        }
      });
      const rawMs = benchSync(`raw als.getStore x${N}`, () => {
        for (let i = 0; i < N; i++) {
          if (als.getStore() !== undefined) sink++;
        }
      });
      console.log(`  -> wrapper overhead: ${(wrapMs / rawMs).toFixed(2)}x raw ALS`);
    });
  });

  if (sink === -1) console.log(sink);
}

main();
