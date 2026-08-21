/**
 * @file Multi Adapter Uplift Unit Tests
 * @description allSettled flush/destroy + any-transport level gate.
 */

import { MultiTransportAdapter } from "../../src/adapters/multi.adapter";
import type { LoggerAdapter } from "../../src/shared/adapter";
import { LOG_LEVEL, type LogLevel } from "../../src/shared/constants";

function makeAdapter(overrides: Partial<LoggerAdapter> = {}): LoggerAdapter {
  return {
    initialize(): void {},
    log(): void {},
    child(): LoggerAdapter {
      return this as LoggerAdapter;
    },
    ...overrides,
  };
}

describe("MultiTransportAdapter uplift", () => {
  it("flush: a failing transport no longer prevents the others from flushing", async () => {
    const flushedB = jest.fn(async () => {});
    const multi = new MultiTransportAdapter([
      makeAdapter({
        flush: async () => {
          throw new Error("transport A down");
        },
      }),
      makeAdapter({ flush: flushedB }),
    ]);

    await expect(multi.flush()).rejects.toThrow("transport A down");
    expect(flushedB).toHaveBeenCalledTimes(1); // frozen Promise.all abandoned B's result
  });

  it("destroy: every transport is destroyed even when one throws", async () => {
    const destroyedB = jest.fn(async () => {});
    const multi = new MultiTransportAdapter([
      makeAdapter({
        destroy: async () => {
          throw new Error("A destroy failed");
        },
      }),
      makeAdapter({ destroy: destroyedB }),
    ]);

    await expect(multi.destroy()).rejects.toThrow("A destroy failed");
    expect(destroyedB).toHaveBeenCalledTimes(1);
  });

  it("isLevelEnabled: enabled if ANY transport would emit", () => {
    const errorOnly = makeAdapter({
      isLevelEnabled: (level: LogLevel) => level === LOG_LEVEL.ERROR,
    });
    const warnPlus = makeAdapter({
      isLevelEnabled: (level: LogLevel) => level === LOG_LEVEL.WARN || level === LOG_LEVEL.ERROR,
    });
    const multi = new MultiTransportAdapter([errorOnly, warnPlus]);
    expect(multi.isLevelEnabled(LOG_LEVEL.ERROR)).toBe(true);
    expect(multi.isLevelEnabled(LOG_LEVEL.WARN)).toBe(true);
    expect(multi.isLevelEnabled(LOG_LEVEL.DEBUG)).toBe(false);
  });

  it("isLevelEnabled: a transport without a gate keeps every level enabled", () => {
    const errorOnly = makeAdapter({
      isLevelEnabled: (level: LogLevel) => level === LOG_LEVEL.ERROR,
    });
    const legacy = makeAdapter();
    const multi = new MultiTransportAdapter([errorOnly, legacy]);
    expect(multi.isLevelEnabled(LOG_LEVEL.DEBUG)).toBe(true);
  });
});
