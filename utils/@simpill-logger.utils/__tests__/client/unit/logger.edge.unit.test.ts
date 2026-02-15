/**
 * @file Edge Logger Unit Tests
 * @description Tests for Edge Runtime / browser logger functionality
 */

import {
  createEdgeLogger,
  disableEdgeMockLogger,
  EdgeLogger,
  EdgeLogInstance,
  edgeLogDebug,
  edgeLogError,
  edgeLogInfo,
  edgeLogWarn,
  enableEdgeMockLogger,
  isEdgeMockLoggerActive,
} from "../../../src/client/logger.edge";

describe("Edge Mock Logger Control", () => {
  afterEach(() => {
    disableEdgeMockLogger();
  });

  describe("enableEdgeMockLogger", () => {
    it("should enable mock logger", () => {
      enableEdgeMockLogger();
      expect(isEdgeMockLoggerActive()).toBe(true);
    });
  });

  describe("disableEdgeMockLogger", () => {
    it("should disable mock logger", () => {
      enableEdgeMockLogger();
      disableEdgeMockLogger();
      expect(isEdgeMockLoggerActive()).toBe(false);
    });
  });

  describe("isEdgeMockLoggerActive", () => {
    it("should return false by default", () => {
      expect(isEdgeMockLoggerActive()).toBe(false);
    });

    it("should return true when enabled", () => {
      enableEdgeMockLogger();
      expect(isEdgeMockLoggerActive()).toBe(true);
    });
  });
});

describe("createEdgeLogger", () => {
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    disableEdgeMockLogger();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should create a logger with all methods", () => {
    const logger = createEdgeLogger("TestEdge");

    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  describe("info", () => {
    it("should call console.info", () => {
      const logger = createEdgeLogger("Test");
      logger.info("Info message");

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should include logger name in output", () => {
      const logger = createEdgeLogger("MyEdgeLogger");
      logger.info("Test");

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("MyEdgeLogger");
    });

    it("should include INFO level", () => {
      const logger = createEdgeLogger("Test");
      logger.info("Test");

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("[INFO]");
    });

    it("should include metadata", () => {
      const logger = createEdgeLogger("Test");
      logger.info("Test", { key: "value" });

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain('"key":"value"');
    });
  });

  describe("warn", () => {
    it("should call console.warn", () => {
      const logger = createEdgeLogger("Test");
      logger.warn("Warning message");

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should include WARN level", () => {
      const logger = createEdgeLogger("Test");
      logger.warn("Test");

      const output = consoleWarnSpy.mock.calls[0][0];
      expect(output).toContain("[WARN]");
    });
  });

  describe("debug", () => {
    it("should call console.debug", () => {
      const logger = createEdgeLogger("Test");
      logger.debug("Debug message");

      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it("should include DEBUG level", () => {
      const logger = createEdgeLogger("Test");
      logger.debug("Test");

      const output = consoleDebugSpy.mock.calls[0][0];
      expect(output).toContain("[DEBUG]");
    });
  });

  describe("error", () => {
    it("should call console.error", () => {
      const logger = createEdgeLogger("Test");
      logger.error("Error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should include ERROR level", () => {
      const logger = createEdgeLogger("Test");
      logger.error("Test");

      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[ERROR]");
    });
  });

  describe("with mock logger enabled", () => {
    beforeEach(() => {
      enableEdgeMockLogger();
    });

    afterEach(() => {
      disableEdgeMockLogger();
    });

    it("should not call console.info when mocked", () => {
      const logger = createEdgeLogger("Test");
      logger.info("Test");

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it("should not call console.warn when mocked", () => {
      const logger = createEdgeLogger("Test");
      logger.warn("Test");

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not call console.debug when mocked", () => {
      const logger = createEdgeLogger("Test");
      logger.debug("Test");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should not call console.error when mocked", () => {
      const logger = createEdgeLogger("Test");
      logger.error("Test");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});

describe("Edge log functions", () => {
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    disableEdgeMockLogger();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("edgeLogInfo", () => {
    it("should log info message", () => {
      edgeLogInfo("TestName", "Info message");

      expect(consoleInfoSpy).toHaveBeenCalled();
      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("TestName");
      expect(output).toContain("Info message");
    });

    it("should include metadata", () => {
      edgeLogInfo("Test", "Message", { data: "value" });

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain('"data":"value"');
    });
  });

  describe("edgeLogWarn", () => {
    it("should log warn message", () => {
      edgeLogWarn("TestName", "Warning message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const output = consoleWarnSpy.mock.calls[0][0];
      expect(output).toContain("TestName");
    });
  });

  describe("edgeLogDebug", () => {
    it("should log debug message", () => {
      edgeLogDebug("TestName", "Debug message");

      expect(consoleDebugSpy).toHaveBeenCalled();
      const output = consoleDebugSpy.mock.calls[0][0];
      expect(output).toContain("TestName");
    });
  });

  describe("edgeLogError", () => {
    it("should log error message", () => {
      edgeLogError("TestName", "Error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("TestName");
    });
  });
});

describe("EdgeLogInstance", () => {
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    disableEdgeMockLogger();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it("should be a pre-configured logger", () => {
    expect(EdgeLogInstance.info).toBeDefined();
    expect(EdgeLogInstance.warn).toBeDefined();
    expect(EdgeLogInstance.debug).toBeDefined();
    expect(EdgeLogInstance.error).toBeDefined();
  });

  it("should use Log context", () => {
    EdgeLogInstance.info("Test");

    const output = consoleInfoSpy.mock.calls[0][0];
    expect(output).toContain("Log");
  });
});

describe("EdgeLogger", () => {
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    disableEdgeMockLogger();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it("should be a pre-configured logger", () => {
    expect(EdgeLogger.info).toBeDefined();
    expect(EdgeLogger.warn).toBeDefined();
    expect(EdgeLogger.debug).toBeDefined();
    expect(EdgeLogger.error).toBeDefined();
  });

  it("should use Logger context", () => {
    EdgeLogger.info("Test");

    const output = consoleInfoSpy.mock.calls[0][0];
    expect(output).toContain("Logger");
  });
});
