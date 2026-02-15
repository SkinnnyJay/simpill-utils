/**
 * @file Simple Adapter Unit Tests
 * @description Tests for the default SimpleLoggerAdapter implementation
 */

import { LOG_LEVEL } from "../../../src/shared/constants";
import type { FormatterAdapter, FormatterContext } from "../../../src/shared/formatters";
import { createSimpleAdapter, SimpleLoggerAdapter } from "../../../src/shared/simple-adapter";

describe("SimpleLoggerAdapter", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create adapter with default settings", () => {
      const adapter = new SimpleLoggerAdapter();
      expect(adapter).toBeInstanceOf(SimpleLoggerAdapter);
    });

    it("should create adapter with name", () => {
      const adapter = new SimpleLoggerAdapter("TestLogger");
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("TestLogger");
    });

    it("should create adapter with default metadata", () => {
      const adapter = new SimpleLoggerAdapter("Test", { service: "my-service" });
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("my-service");
    });

    it("should create adapter with custom formatter", () => {
      const customFormatter: FormatterAdapter = {
        formatInfo: (ctx: FormatterContext) => `CUSTOM: ${ctx.message}`,
        formatWarn: (ctx: FormatterContext) => `CUSTOM: ${ctx.message}`,
        formatDebug: (ctx: FormatterContext) => `CUSTOM: ${ctx.message}`,
        formatError: (ctx: FormatterContext) => `CUSTOM: ${ctx.message}`,
      };

      const adapter = new SimpleLoggerAdapter("Test", undefined, customFormatter);
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.INFO, message: "Hello", name: "Test" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("CUSTOM: Hello");
    });
  });

  describe("initialize", () => {
    it("should set minimum log level", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({ minLevel: LOG_LEVEL.WARN });

      // DEBUG should be filtered
      adapter.log({ level: LOG_LEVEL.DEBUG, message: "Debug", name: "Test" });
      expect(stdoutSpy).not.toHaveBeenCalled();

      // WARN should pass
      adapter.log({ level: LOG_LEVEL.WARN, message: "Warn", name: "Test" });
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it("should accept custom formatter via config", () => {
      const customFormatter: FormatterAdapter = {
        formatInfo: () => "CONFIGURED",
        formatWarn: () => "CONFIGURED",
        formatDebug: () => "CONFIGURED",
        formatError: () => "CONFIGURED",
      };

      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({ formatter: customFormatter });
      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("CONFIGURED");
    });
  });

  describe("log", () => {
    it("should write INFO to stdout", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.INFO, message: "Info message", name: "Test" });

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should write WARN to stdout", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.WARN, message: "Warn message", name: "Test" });

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should write DEBUG to stdout", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.DEBUG, message: "Debug message", name: "Test" });

      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should write ERROR to stderr", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({});
      adapter.log({ level: LOG_LEVEL.ERROR, message: "Error message", name: "Test" });

      expect(stderrSpy).toHaveBeenCalled();
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("should include metadata in output", () => {
      const adapter = new SimpleLoggerAdapter();
      adapter.initialize({});
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
        metadata: { userId: "123" },
      });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("userId");
      expect(output).toContain("123");
    });

    it("should merge default metadata with entry metadata", () => {
      const adapter = new SimpleLoggerAdapter("Test", { service: "api" });
      adapter.initialize({});
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Test",
        metadata: { requestId: "456" },
      });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("service");
      expect(output).toContain("api");
      expect(output).toContain("requestId");
      expect(output).toContain("456");
    });
  });

  describe("child", () => {
    it("should create child adapter with name", () => {
      const parent = new SimpleLoggerAdapter();
      parent.initialize({});

      const child = parent.child("ChildLogger");
      child.log({ level: LOG_LEVEL.INFO, message: "Child message", name: "" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("ChildLogger");
    });

    it("should inherit parent configuration", () => {
      const parent = new SimpleLoggerAdapter();
      parent.initialize({ minLevel: LOG_LEVEL.WARN });

      const child = parent.child("Child");

      // DEBUG should be filtered (inherited from parent)
      child.log({ level: LOG_LEVEL.DEBUG, message: "Debug", name: "Child" });
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("should merge parent and child metadata", () => {
      const parent = new SimpleLoggerAdapter("Parent", { service: "api" });
      parent.initialize({});

      const child = parent.child("Child", { component: "auth" });
      child.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Child" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("service");
      expect(output).toContain("component");
    });

    it("should inherit formatter from parent", () => {
      const customFormatter: FormatterAdapter = {
        formatInfo: () => "INHERITED",
        formatWarn: () => "INHERITED",
        formatDebug: () => "INHERITED",
        formatError: () => "INHERITED",
      };

      const parent = new SimpleLoggerAdapter("Parent", undefined, customFormatter);
      parent.initialize({});

      const child = parent.child("Child");
      child.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Child" });

      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain("INHERITED");
    });
  });

  describe("flush", () => {
    it("should resolve immediately (no-op)", async () => {
      const adapter = new SimpleLoggerAdapter();
      await expect(adapter.flush()).resolves.toBeUndefined();
    });
  });

  describe("destroy", () => {
    it("should resolve immediately (no-op)", async () => {
      const adapter = new SimpleLoggerAdapter();
      await expect(adapter.destroy()).resolves.toBeUndefined();
    });
  });
});

describe("createSimpleAdapter", () => {
  it("should create and initialize adapter", () => {
    const adapter = createSimpleAdapter({ minLevel: "INFO" });
    expect(adapter).toBeInstanceOf(SimpleLoggerAdapter);
  });

  it("should work with empty config", () => {
    const adapter = createSimpleAdapter();
    expect(adapter).toBeInstanceOf(SimpleLoggerAdapter);
  });
});
