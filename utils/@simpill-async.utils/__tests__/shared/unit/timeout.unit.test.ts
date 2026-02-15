import { timeoutWithFallback } from "../../../src/shared/timeout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("timeoutWithFallback", () => {
  it("returns fallback when timeout wins", async () => {
    const result = await timeoutWithFallback(
      wait(20).then(() => "late"),
      5,
      "fallback",
    );
    expect(result).toBe("fallback");
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

    const result = await timeoutWithFallback(
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("late")), 20)),
      5,
      "fallback",
    );
    expect(result).toBe("fallback");
    await wait(30);

    process.off("unhandledRejection", handler);
    expect(unhandled).toHaveLength(0);
  });
});
