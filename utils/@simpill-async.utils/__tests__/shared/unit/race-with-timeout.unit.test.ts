import {
  TIMEOUT_MS_1000,
  VALUE_10,
  VALUE_42,
  VALUE_50,
  VALUE_60,
} from "../../../src/shared/constants";
import { raceWithTimeout } from "../../../src/shared/race-with-timeout";

describe("raceWithTimeout", () => {
  it("returns result when promise resolves first", async () => {
    const r = await raceWithTimeout(Promise.resolve(VALUE_42), TIMEOUT_MS_1000);
    expect(r).toBe(VALUE_42);
  });

  it("throws when timeout wins", async () => {
    await expect(raceWithTimeout(new Promise<number>(() => {}), VALUE_10)).rejects.toThrow(
      /timed out/,
    );
  });

  it("does not surface unhandled rejection when original promise rejects after timeout", async () => {
    let lateRejectionHandled = false;
    const originalPromise = new Promise<number>((_, reject) => {
      setTimeout(() => {
        reject(new Error("late"));
        lateRejectionHandled = true;
      }, VALUE_50);
    });
    const unhandledRejections: unknown[] = [];
    const handler = (reason: unknown) => {
      unhandledRejections.push(reason);
    };
    process.on("unhandledRejection", handler);
    try {
      await expect(raceWithTimeout(originalPromise, VALUE_10)).rejects.toThrow(/timed out/);
      await new Promise((r) => setTimeout(r, VALUE_60));
      expect(unhandledRejections).toHaveLength(0);
      expect(lateRejectionHandled).toBe(true);
    } finally {
      process.off("unhandledRejection", handler);
    }
  });
});
