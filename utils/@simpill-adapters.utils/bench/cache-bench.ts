/** Benchmarks: new memoryCacheAdapter vs frozen original vs keyv in-memory. */
// Run with: npm i --no-save keyv tsx && npx tsx bench/cache-bench.ts
import Keyv from "keyv";
import { memoryCacheAdapter } from "../src/shared/cache-adapter";

// Frozen original (commit 942f998) inlined verbatim for a fair baseline.
interface OrigCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  has(key: K): boolean;
}
function originalMemoryCacheAdapter<K = string, V = unknown>(): OrigCache<K, V> {
  const map = new Map<K, V>();
  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      map.set(key, value);
    },
    delete(key) {
      return map.delete(key);
    },
    has(key) {
      return map.has(key);
    },
  };
}

const N = 2_000_000;
const KEYS = Array.from({ length: 1000 }, (_, i) => `key-${i}`);

function benchSync(
  label: string,
  cache: { get(k: string): unknown; set(k: string, v: number): unknown },
  quiet = false
) {
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const k = KEYS[i % 1000];
    cache.set(k, i);
    if (cache.get(k) !== i) throw new Error("wrong value");
  }
  const ms = performance.now() - t0;
  if (!quiet)
    console.log(
      `${label}: ${ms.toFixed(1)}ms for ${N.toLocaleString()} set+get pairs (${(((N / ms) * 1000) / 1e6).toFixed(2)}M pairs/s)`
    );
  return ms;
}

async function benchKeyv() {
  const keyv = new Keyv();
  const n = 200_000;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const k = KEYS[i % 1000];
    await keyv.set(k, i);
    if ((await keyv.get(k)) !== i) throw new Error("wrong value");
  }
  const ms = performance.now() - t0;
  const pairsPerSec = (n / ms) * 1000;
  console.log(
    `keyv (in-memory): ${ms.toFixed(1)}ms for ${n.toLocaleString()} set+get pairs (${(pairsPerSec / 1e6).toFixed(3)}M pairs/s)`
  );
  return pairsPerSec;
}

async function main() {
  benchSync("warmup", originalMemoryCacheAdapter<string, number>(), true);
  benchSync("warmup", memoryCacheAdapter<string, number>(), true);
  const runs = 3;
  let orig = Infinity,
    plain = Infinity,
    lru = Infinity,
    ttl = Infinity;
  for (let r = 0; r < runs; r++) {
    orig = Math.min(
      orig,
      benchSync("original (frozen 942f998)", originalMemoryCacheAdapter<string, number>())
    );
    plain = Math.min(
      plain,
      benchSync("new memoryCacheAdapter()", memoryCacheAdapter<string, number>())
    );
    lru = Math.min(
      lru,
      benchSync(
        "new memoryCacheAdapter({maxSize:1000})",
        memoryCacheAdapter<string, number>({ maxSize: 1000 })
      )
    );
    ttl = Math.min(
      ttl,
      benchSync(
        "new memoryCacheAdapter({ttlMs:60000})",
        memoryCacheAdapter<string, number>({ ttlMs: 60_000 })
      )
    );
  }
  console.log("--- best of", runs, "---");
  console.log(
    `original: ${orig.toFixed(1)}ms | new(plain): ${plain.toFixed(1)}ms | ratio ${(plain / orig).toFixed(2)}x`
  );
  console.log(
    `new(LRU maxSize=1000): ${lru.toFixed(1)}ms (${(lru / orig).toFixed(2)}x of original)`
  );
  console.log(`new(TTL 60s): ${ttl.toFixed(1)}ms (${(ttl / orig).toFixed(2)}x of original)`);
  const keyvPairsPerSec = await benchKeyv();
  const newPairsPerSec = (N / plain) * 1000;
  console.log(`new(plain) vs keyv: ${(newPairsPerSec / keyvPairsPerSec).toFixed(1)}x faster`);
}
main();
