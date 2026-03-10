/**
 * @simpill/request-context.utils - Basic usage (Node.js server)
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { getRequestContext, runWithRequestContext } from "@simpill/request-context.utils/server";

async function main() {
  await runWithRequestContext({ requestId: "req-123", traceId: "trace-456" }, async () => {
    const ctx = getRequestContext();
    console.log("requestId:", ctx?.requestId);
    console.log("traceId:", ctx?.traceId);

    // Context is available in nested async work
    await Promise.resolve();
    console.log("Still in context:", getRequestContext()?.requestId);
  });

  // Outside run: no context
  console.log("Outside run:", getRequestContext());
}

main().catch(console.error);
