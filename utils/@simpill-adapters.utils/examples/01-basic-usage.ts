/**
 * @simpill/adapters.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { consoleLoggerAdapter, createAdapter, memoryCacheAdapter } from "@simpill/adapters.utils";

// In-memory cache adapter
const cache = memoryCacheAdapter<string, number>();
cache.set("count", 42);
console.log("cache.get('count'):", cache.get("count")); // 42
console.log("cache.has('count'):", cache.has("count")); // true
cache.delete("count");
console.log("cache.has('count'):", cache.has("count")); // false

// Logger adapter from console
const logger = consoleLoggerAdapter(console);
logger.info("Hello from adapter");
logger.warn("Warning message");

// createAdapter: wrap an implementation (identity by default)
const impl = { get: (k: string) => k.toUpperCase() };
const adapter = createAdapter(impl);
console.log("adapter.get('hi'):", adapter.get("hi")); // "HI"
