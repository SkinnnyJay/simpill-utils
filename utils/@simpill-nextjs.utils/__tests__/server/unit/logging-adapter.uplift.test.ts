/** @file logging uplift: minLevel gate skips work below threshold */
import { createLoggingIntegration } from "../../../src/server/logging-adapter";

describe("minLevel", () => {
  it("drops below-threshold calls before context lookup", () => {
    const spyDebug = jest.spyOn(console, "debug").mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const contextCalls = jest.fn(() => ({ requestId: "r1" }));
    const log = createLoggingIntegration({ getRequestContext: contextCalls, minLevel: "warn" });
    const logger = log.getLogger("svc");
    logger.debug("hidden");
    logger.warn("shown");
    expect(spyDebug).not.toHaveBeenCalled();
    expect(spyWarn).toHaveBeenCalledWith("[svc] shown", { requestId: "r1" });
    expect(contextCalls).toHaveBeenCalledTimes(1); // not called for the dropped debug line
    spyDebug.mockRestore();
    spyWarn.mockRestore();
  });

  it("default remains debug-everything (original tests byte-compatible)", () => {
    const spyDebug = jest.spyOn(console, "debug").mockImplementation(() => {});
    const log = createLoggingIntegration();
    log.getLogger().debug("d");
    expect(spyDebug).toHaveBeenCalledWith("d", {});
    spyDebug.mockRestore();
  });
});
