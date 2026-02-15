import { createLoggingIntegration } from "../../../src/server/logging-adapter";

describe("createLoggingIntegration", () => {
  it("getLogger returns logger with info/warn/error/debug", () => {
    const log = createLoggingIntegration();
    const logger = log.getLogger("test");
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it("setLogContextProvider does not throw", () => {
    const log = createLoggingIntegration();
    expect(() => log.setLogContextProvider(() => ({ requestId: "r1" }))).not.toThrow();
  });
});
