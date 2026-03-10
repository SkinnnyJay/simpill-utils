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

  it("logger methods call console and accept optional meta", () => {
    const spyInfo = jest.spyOn(console, "info").mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const spyError = jest.spyOn(console, "error").mockImplementation(() => {});
    const spyDebug = jest.spyOn(console, "debug").mockImplementation(() => {});

    const log = createLoggingIntegration();
    const logger = log.getLogger("svc");
    logger.info("msg");
    logger.warn("w", { a: 1 });
    logger.error("e");
    logger.debug("d", { b: 2 });

    expect(spyInfo).toHaveBeenCalledWith("[svc] msg", {});
    expect(spyWarn).toHaveBeenCalledWith("[svc] w", { a: 1 });
    expect(spyError).toHaveBeenCalledWith("[svc] e", {});
    expect(spyDebug).toHaveBeenCalledWith("[svc] d", { b: 2 });

    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
    spyDebug.mockRestore();
  });

  it("setLogContextProvider does not throw", () => {
    const log = createLoggingIntegration();
    expect(() => log.setLogContextProvider(() => ({ requestId: "r1" }))).not.toThrow();
  });

  it("getLogger merges context from setLogContextProvider into log meta", () => {
    const spyInfo = jest.spyOn(console, "info").mockImplementation(() => {});
    const log = createLoggingIntegration();
    log.setLogContextProvider(() => ({ requestId: "r1", traceId: "t1" }));
    const logger = log.getLogger();
    logger.info("hello");
    expect(spyInfo).toHaveBeenCalledWith("hello", { requestId: "r1", traceId: "t1" });
    spyInfo.mockRestore();
  });

  it("getLogger uses getRequestContext when no contextProvider set", () => {
    const spyInfo = jest.spyOn(console, "info").mockImplementation(() => {});
    const log = createLoggingIntegration({
      getRequestContext: () => ({ reqId: "from-options" }),
    });
    const logger = log.getLogger();
    logger.info("msg");
    expect(spyInfo).toHaveBeenCalledWith("msg", { reqId: "from-options" });
    spyInfo.mockRestore();
  });

  it("calls setLogContextProvider option when set", () => {
    const setLogContextProvider = jest.fn();
    const log = createLoggingIntegration({ setLogContextProvider });
    const provider = () => ({ x: 1 });
    log.setLogContextProvider(provider);
    expect(setLogContextProvider).toHaveBeenCalledWith(provider);
  });
});
