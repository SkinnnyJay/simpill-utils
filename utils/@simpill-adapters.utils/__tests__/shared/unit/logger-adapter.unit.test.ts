import { consoleLoggerAdapter } from "../../../src/shared/logger-adapter";

describe("consoleLoggerAdapter", () => {
  it("should wrap console-like object", () => {
    const logs: string[] = [];
    const consoleLike = {
      log: (m: string) => logs.push(`log:${m}`),
      warn: (m: string) => logs.push(`warn:${m}`),
      error: (m: string) => logs.push(`error:${m}`),
    };
    const logger = consoleLoggerAdapter(consoleLike);
    logger.info("a");
    logger.warn("b");
    logger.error("c");
    logger.debug("d");
    expect(logs).toContain("log:a");
    expect(logs).toContain("warn:b");
    expect(logs).toContain("error:c");
    expect(logs).toContain("log:d");
  });
});
