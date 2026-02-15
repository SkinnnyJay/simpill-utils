/**
 * @file Server Logger Unit Tests
 * @description Tests for Node.js server logger functionality
 */

import {
  createClassLogger,
  disableMockLogger,
  enableMockLogger,
  isMockLoggerActive,
  LoggerSingleton,
  LogInstance,
  logExecutorEvent,
  logLLMEvent,
  logTable,
} from "../../../src/server/logger";
import { LoggerFactory } from "../../../src/shared/factory";
import type { Logger } from "../../../src/shared/types";

describe("Mock Logger Control", () => {
  beforeEach(async () => {
    await LoggerFactory.reset();
  });

  afterEach(async () => {
    disableMockLogger();
    await LoggerFactory.reset();
  });

  describe("enableMockLogger", () => {
    it("should enable mock logger", () => {
      enableMockLogger();
      expect(isMockLoggerActive()).toBe(true);
    });
  });

  describe("disableMockLogger", () => {
    it("should disable mock logger", () => {
      enableMockLogger();
      disableMockLogger();
      expect(isMockLoggerActive()).toBe(false);
    });
  });

  describe("isMockLoggerActive", () => {
    it("should return false by default", () => {
      expect(isMockLoggerActive()).toBe(false);
    });

    it("should return true when enabled", () => {
      enableMockLogger();
      expect(isMockLoggerActive()).toBe(true);
    });
  });
});

describe("createClassLogger", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    disableMockLogger();
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    await LoggerFactory.reset();
  });

  it("should create a logger with all methods", () => {
    const logger = createClassLogger("TestClass");

    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("should include class name in log output", () => {
    const logger = createClassLogger("MyClass");
    logger.info("Test message");

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("MyClass");
  });

  describe("info", () => {
    it("should write to stdout", () => {
      const logger = createClassLogger("Test");
      logger.info("Info message");

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should include INFO level in output", () => {
      const logger = createClassLogger("Test");
      logger.info("Test");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[INFO]");
    });

    it("should include metadata when provided", () => {
      const logger = createClassLogger("Test");
      logger.info("Test", { userId: "123" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('"userId":"123"');
    });
  });

  describe("warn", () => {
    it("should write to stdout", () => {
      const logger = createClassLogger("Test");
      logger.warn("Warning message");

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should include WARN level in output", () => {
      const logger = createClassLogger("Test");
      logger.warn("Test");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[WARN]");
    });
  });

  describe("debug", () => {
    it("should write to stdout", () => {
      const logger = createClassLogger("Test");
      logger.debug("Debug message");

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should include DEBUG level in output", () => {
      const logger = createClassLogger("Test");
      logger.debug("Test");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[DEBUG]");
    });
  });

  describe("error", () => {
    it("should write to stderr", () => {
      const logger = createClassLogger("Test");
      logger.error("Error message");

      expect(stderrSpy).toHaveBeenCalled();
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("should include ERROR level in output", () => {
      const logger = createClassLogger("Test");
      logger.error("Test");

      const output = stderrSpy.mock.calls[0][0];
      expect(output).toContain("[ERROR]");
    });
  });

  describe("with mock logger enabled", () => {
    beforeEach(() => {
      enableMockLogger();
    });

    afterEach(() => {
      disableMockLogger();
    });

    it("should not write to stdout when mocked", () => {
      const logger = createClassLogger("Test");
      logger.info("Test");

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("should not write to stderr when mocked", () => {
      const logger = createClassLogger("Test");
      logger.error("Test");

      expect(stderrSpy).not.toHaveBeenCalled();
    });
  });
});

describe("LoggerSingleton", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    LoggerSingleton.resetInstance();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    disableMockLogger();
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    LoggerSingleton.resetInstance();
    await LoggerFactory.reset();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = LoggerSingleton.getInstance();
      const instance2 = LoggerSingleton.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("resetInstance", () => {
    it("should reset the singleton", () => {
      const instance1 = LoggerSingleton.getInstance();
      LoggerSingleton.resetInstance();
      const instance2 = LoggerSingleton.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("getLogger", () => {
    it("should return a logger for a context", () => {
      const singleton = LoggerSingleton.getInstance();
      const logger = singleton.getLogger("CustomContext");

      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it("should use the provided context name", () => {
      const singleton = LoggerSingleton.getInstance();
      const logger = singleton.getLogger("MyContext");
      logger.info("Test");

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("MyContext");
    });
  });

  describe("logging methods", () => {
    it("should log info messages", () => {
      const singleton = LoggerSingleton.getInstance();
      singleton.info("Info test");

      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[INFO]");
    });

    it("should log warn messages", () => {
      const singleton = LoggerSingleton.getInstance();
      singleton.warn("Warn test");

      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[WARN]");
    });

    it("should log debug messages", () => {
      const singleton = LoggerSingleton.getInstance();
      singleton.debug("Debug test");

      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("[DEBUG]");
    });

    it("should log error messages to stderr", () => {
      const singleton = LoggerSingleton.getInstance();
      singleton.error("Error test");

      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls[0][0];
      expect(output).toContain("[ERROR]");
    });

    it("should include metadata", () => {
      const singleton = LoggerSingleton.getInstance();
      singleton.info("Test", { key: "value" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('"key":"value"');
    });
  });
});

describe("LogInstance", () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(async () => {
    await LoggerFactory.reset();
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    disableMockLogger();
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    await LoggerFactory.reset();
  });

  it("should be a pre-configured logger", () => {
    expect(LogInstance.info).toBeDefined();
    expect(LogInstance.warn).toBeDefined();
    expect(LogInstance.debug).toBeDefined();
    expect(LogInstance.error).toBeDefined();
  });

  it("should use Log context", () => {
    LogInstance.info("Test");

    const output = stdoutSpy.mock.calls[0][0];
    expect(output).toContain("Log");
  });
});

describe("logTable", () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    enableMockLogger();
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };
    consoleSpy = jest.spyOn(console, "table").mockImplementation(() => {});
  });

  afterEach(() => {
    disableMockLogger();
    consoleSpy.mockRestore();
  });

  it("should call logger with table metadata", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    logTable(logger, "info", "Test table", rows);

    expect(logger.info).toHaveBeenCalledWith("Test table", { table: rows });
  });

  it("should not call console.table when mock logger is enabled", () => {
    const rows = [{ id: 1 }];
    logTable(logger, "info", "Test", rows);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should call console.table when mock logger is disabled", () => {
    disableMockLogger();
    const rows = [{ id: 1 }];
    logTable(logger, "info", "Test", rows);

    expect(consoleSpy).toHaveBeenCalledWith(rows);
  });

  it("should support warn level", () => {
    const rows = [{ id: 1 }];
    logTable(logger, "warn", "Warning table", rows);

    expect(logger.warn).toHaveBeenCalled();
  });

  it("should support debug level", () => {
    const rows = [{ id: 1 }];
    logTable(logger, "debug", "Debug table", rows);

    expect(logger.debug).toHaveBeenCalled();
  });
});

describe("logExecutorEvent", () => {
  it("should call logger.info", () => {
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    logExecutorEvent(logger, "Executor event");

    expect(logger.info).toHaveBeenCalledWith("Executor event", undefined);
  });

  it("should pass metadata", () => {
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    logExecutorEvent(logger, "Event", { executorId: "123" });

    expect(logger.info).toHaveBeenCalledWith("Event", { executorId: "123" });
  });
});

describe("logLLMEvent", () => {
  it("should call logger.info", () => {
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    logLLMEvent(logger, "LLM event");

    expect(logger.info).toHaveBeenCalledWith("LLM event", undefined);
  });

  it("should pass metadata", () => {
    const logger: Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    logLLMEvent(logger, "Event", { model: "gpt-4" });

    expect(logger.info).toHaveBeenCalledWith("Event", { model: "gpt-4" });
  });
});
