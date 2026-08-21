import {
  consoleLoggerAdapter,
  LOG_LEVELS,
  levelFilterLoggerAdapter,
  noopLoggerAdapter,
  prefixLoggerAdapter,
} from "../../../src/shared/logger-adapter";

describe("consoleLoggerAdapter fallbacks", () => {
  it("accepts a log-only console-like: warn/error fall back to log (previously crashed)", () => {
    const logs: string[] = [];
    const logger = consoleLoggerAdapter({ log: (m: string) => logs.push(m) });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(logs).toEqual(["d", "i", "w", "e"]);
  });

  it("looks methods up at call time so late-installed spies are honored", () => {
    const consoleLike: { log: (m: string) => void; warn?: (m: string) => void } = {
      log: () => undefined,
    };
    const logger = consoleLoggerAdapter(consoleLike);
    const spy = jest.fn();
    consoleLike.warn = spy; // installed AFTER wrapping
    logger.warn("late");
    expect(spy).toHaveBeenCalledWith("late");
  });
});

describe("noopLoggerAdapter", () => {
  it("discards everything and is frozen", () => {
    expect(() => noopLoggerAdapter.error("x")).not.toThrow();
    expect(Object.isFrozen(noopLoggerAdapter)).toBe(true);
  });
});

describe("prefixLoggerAdapter", () => {
  it("prepends the prefix to every message and forwards args", () => {
    const calls: unknown[][] = [];
    const base = {
      debug: (...a: unknown[]) => calls.push(["debug", ...a]),
      info: (...a: unknown[]) => calls.push(["info", ...a]),
      warn: (...a: unknown[]) => calls.push(["warn", ...a]),
      error: (...a: unknown[]) => calls.push(["error", ...a]),
    };
    const logger = prefixLoggerAdapter(base, "[db] ");
    logger.info("connected", 42);
    logger.error("failed");
    expect(calls).toEqual([
      ["info", "[db] connected", 42],
      ["error", "[db] failed"],
    ]);
  });
});

describe("levelFilterLoggerAdapter", () => {
  it("drops calls below minLevel and forwards the rest", () => {
    const calls: string[] = [];
    const base = {
      debug: (m: string) => calls.push(`debug:${m}`),
      info: (m: string) => calls.push(`info:${m}`),
      warn: (m: string) => calls.push(`warn:${m}`),
      error: (m: string) => calls.push(`error:${m}`),
    };
    const logger = levelFilterLoggerAdapter(base, "warn");
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");
    expect(calls).toEqual(["warn:c", "error:d"]);
  });

  it("minLevel debug forwards everything; unknown level throws", () => {
    const calls: string[] = [];
    const base = {
      debug: (m: string) => calls.push(m),
      info: (m: string) => calls.push(m),
      warn: (m: string) => calls.push(m),
      error: (m: string) => calls.push(m),
    };
    const logger = levelFilterLoggerAdapter(base, "debug");
    for (const level of LOG_LEVELS) logger[level]("x");
    expect(calls).toHaveLength(4);
    expect(() => levelFilterLoggerAdapter(base, "verbose" as unknown as "debug")).toThrow(
      RangeError
    );
  });
});
