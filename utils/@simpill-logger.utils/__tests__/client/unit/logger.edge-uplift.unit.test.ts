/**
 * @file Edge Logger Uplift Unit Tests
 * @description minLevel is honored (frozen version silently ignored it) + child loggers.
 */

import { createEdgeLogger } from "../../../src/client/logger.edge";
import { LOG_LEVEL } from "../../../src/shared/constants";

describe("createEdgeLogger uplift", () => {
  let infoSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("honors options.minLevel (frozen version logged everything regardless)", () => {
    const logger = createEdgeLogger("Edge", { minLevel: LOG_LEVEL.ERROR });
    logger.debug("dropped");
    logger.info("dropped");
    logger.error("kept");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("defaults to DEBUG (previous output unchanged when no options are passed)", () => {
    const logger = createEdgeLogger("Edge");
    logger.debug("kept");
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it("exposes isLevelEnabled", () => {
    const logger = createEdgeLogger("Edge", { minLevel: LOG_LEVEL.WARN });
    expect(logger.isLevelEnabled?.(LOG_LEVEL.DEBUG)).toBe(false);
    expect(logger.isLevelEnabled?.(LOG_LEVEL.ERROR)).toBe(true);
  });

  it("child(name) appends the name; child metadata is merged into every call", () => {
    const logger = createEdgeLogger("Svc");
    const child = logger.child?.("db", { tenant: "t1" });
    child?.info("query", { q: 1 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const line = String(infoSpy.mock.calls[0][0]);
    expect(line).toContain("Svc.db");
    expect(line).toContain('"tenant":"t1"');
    expect(line).toContain('"q":1');
  });

  it("children inherit minLevel", () => {
    const logger = createEdgeLogger("Svc", { minLevel: LOG_LEVEL.ERROR });
    const child = logger.child?.("c");
    child?.info("dropped");
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
