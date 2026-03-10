/**
 * @simpill/http.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  createHttpClient,
  fetchWithRetry,
  fetchWithTimeout,
  isRetryableStatus,
} from "@simpill/http.utils";

async function main() {
  // Timeout: abort request after N ms
  const res = await fetchWithTimeout("https://httpbin.org/delay/1", {
    timeoutMs: 5000,
  });
  console.log("fetchWithTimeout status:", res.status);

  // Retry: retry on 408, 429, 5xx (or custom policy)
  const res2 = await fetchWithRetry("https://httpbin.org/status/200", undefined, {
    retry: { maxAttempts: 3, delayMs: 100, backoffMultiplier: 2 },
  });
  console.log("fetchWithRetry status:", res2.status);

  // Typed client with baseUrl and defaults
  const client = createHttpClient({
    baseUrl: "https://httpbin.org",
    defaultTimeoutMs: 5000,
    defaultRetry: { maxAttempts: 2 },
  });
  const getRes = await client.get("/get");
  console.log("client.get /get:", getRes.status);

  // isRetryableStatus helper
  console.log("isRetryableStatus(429):", isRetryableStatus(429));
  console.log("isRetryableStatus(200):", isRetryableStatus(200));
}

main().catch(console.error);
