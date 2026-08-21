import { getRequestContext, runWithRequestContextSync } from "../../../src/server";

/**
 * Regression for the README's broken Express recipe. The old recipe called
 * `next(reject)` — Express treats ANY argument to next() as an error, so
 * every request was routed to the error handler (verified against express@4:
 * status 500 + error handler hit on a plain GET /). The correct pattern is
 * simply to call next() with NO arguments inside the run; ALS propagates to
 * the handlers next() invokes and to all their async continuations.
 */
describe("middleware pattern (Express semantics)", () => {
  it("documented pattern calls next() with zero arguments", () => {
    const nextCalls: unknown[][] = [];
    const next = (...args: unknown[]) => {
      nextCalls.push(args);
    };
    // The pattern now documented in the README:
    runWithRequestContextSync({ requestId: "mw-1" }, () => next());
    expect(nextCalls).toEqual([[]]); // no error argument — Express stays on the happy path
  });

  it("handlers invoked by next() see the context, including async continuations", async () => {
    const seen: Array<string | undefined> = [];
    const handler = async () => {
      seen.push(getRequestContext()?.requestId);
      await Promise.resolve();
      seen.push(getRequestContext()?.requestId);
    };
    let pending: Promise<void> | undefined;
    runWithRequestContextSync({ requestId: "mw-2" }, () => {
      pending = handler(); // what next() -> route handler does
    });
    await pending;
    expect(seen).toEqual(["mw-2", "mw-2"]);
  });
});
