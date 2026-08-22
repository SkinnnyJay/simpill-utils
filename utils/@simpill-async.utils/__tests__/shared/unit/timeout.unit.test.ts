import { timeoutWithFallback } from "../../../src/shared/timeout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A promise whose settlement the test triggers directly.
 *
 * These cases are about which branch wins, so they must not be decided by two
 * real timers racing: a stalled event loop can let a 20 ms timer fire before a
 * 5 ms one, and the slow promise then wins a race it was written to lose.
 * Settling on demand removes the margin entirely.
 */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("timeoutWithFallback", () => {
  it("returns fallback when timeout wins", async () => {
    const slow = deferred<string>();

    const result = await timeoutWithFallback(slow.promise, 5, "fallback");

    expect(result).toBe("fallback");
    slow.resolve("late");
  });

  it("returns original result when it resolves first", async () => {
    const result = await timeoutWithFallback(Promise.resolve("ok"), 10, "fallback");
    expect(result).toBe("ok");
  });

  it("does not emit unhandled rejection when timeout wins", async () => {
    const unhandled: unknown[] = [];
    const handler = (reason: unknown): void => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", handler);

    const slow = deferred<string>();
    const result = await timeoutWithFallback(slow.promise, 5, "fallback");
    expect(result).toBe("fallback");

    // Reject only once the fallback has been returned: the property under test
    // is that a settlement arriving after the race is over stays swallowed.
    slow.reject(new Error("late"));
    await wait(30);

    process.off("unhandledRejection", handler);
    expect(unhandled).toHaveLength(0);
  });
});
