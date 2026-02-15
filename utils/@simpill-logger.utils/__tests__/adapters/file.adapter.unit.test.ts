/**
 * @file File Adapter Unit Tests
 * @description Tests for the FileLoggerAdapter with rotation support
 */

import * as fs from "node:fs";
import { createFileAdapter, FileLoggerAdapter } from "../../src/adapters/file.adapter";
import { BufferedLoggerAdapter } from "../../src/shared/buffered-adapter";
import { FILE_TRANSPORT_DEFAULTS, LOG_LEVEL } from "../../src/shared/constants";

// Mock fs module
jest.mock("node:fs");

const mockFs = fs as jest.Mocked<typeof fs>;

function createMockStats(overrides: { size?: number } = {}): fs.Stats {
  return { size: 0, ...overrides } as fs.Stats;
}

function getWrittenContentAt(callIndex: number): string {
  const calls = mockFs.appendFileSync.mock.calls;
  expect(calls.length).toBeGreaterThan(callIndex);
  const content = calls[callIndex]?.[1];
  expect(typeof content).toBe("string");
  if (typeof content !== "string") throw new Error("expected string");
  return content;
}

describe("FileLoggerAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue(createMockStats());
    mockFs.appendFileSync.mockImplementation(() => undefined);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.renameSync.mockImplementation(() => undefined);
    mockFs.unlinkSync.mockImplementation(() => undefined);
  });

  describe("constructor", () => {
    it("should create adapter with default settings", () => {
      const adapter = new FileLoggerAdapter();
      expect(adapter).toBeInstanceOf(FileLoggerAdapter);
    });

    it("should create adapter with custom configuration", () => {
      const adapter = new FileLoggerAdapter({
        directory: "./custom-logs",
        combinedFilename: "app.log",
        errorFilename: "errors.log",
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 3,
        format: "pretty",
      });
      expect(adapter).toBeInstanceOf(FileLoggerAdapter);
    });
  });

  describe("initialize", () => {
    it("should create log directory if it does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const adapter = new FileLoggerAdapter({ directory: "./logs" });
      adapter.initialize({});

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("logs"), {
        recursive: true,
      });
    });

    it("should not create directory if it already exists", () => {
      mockFs.existsSync.mockReturnValue(true);

      const adapter = new FileLoggerAdapter({ directory: "./logs" });
      adapter.initialize({});

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it("should set minimum log level from config", () => {
      const adapter = new FileLoggerAdapter();
      adapter.initialize({ minLevel: LOG_LEVEL.WARN });

      // DEBUG should be filtered
      adapter.log({ level: LOG_LEVEL.DEBUG, message: "Debug", name: "Test" });
      expect(mockFs.appendFileSync).not.toHaveBeenCalled();

      // WARN should pass
      adapter.log({ level: LOG_LEVEL.WARN, message: "Warn", name: "Test" });
      expect(mockFs.appendFileSync).toHaveBeenCalled();
    });
  });

  describe("log", () => {
    it("should write INFO to combined log only", () => {
      const adapter = new FileLoggerAdapter({ directory: "./logs" });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Info message", name: "Test" });

      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(1);
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("combined.log"),
        expect.any(String),
        "utf8"
      );
    });

    it("should write ERROR to both combined and error logs", () => {
      const adapter = new FileLoggerAdapter({ directory: "./logs" });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.ERROR, message: "Error message", name: "Test" });

      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("combined.log"),
        expect.any(String),
        "utf8"
      );
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("error.log"),
        expect.any(String),
        "utf8"
      );
    });

    it("should format output as JSON by default", () => {
      const adapter = new FileLoggerAdapter();
      adapter.initialize({});

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test message",
        name: "TestLogger",
        metadata: { userId: "123" },
      });

      const writtenContent = getWrittenContentAt(0);
      const parsed = JSON.parse(writtenContent.trim());

      expect(parsed.level).toBe("INFO");
      expect(parsed.message).toBe("Test message");
      expect(parsed.name).toBe("TestLogger");
      expect(parsed.userId).toBe("123");
      expect(parsed.timestamp).toBeDefined();
    });

    it("should format output as pretty when configured", () => {
      const adapter = new FileLoggerAdapter({ format: "pretty" });
      adapter.initialize({});

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test message",
        name: "TestLogger",
      });

      const writtenContent = getWrittenContentAt(0);

      expect(writtenContent).toContain("INFO");
      expect(writtenContent).toContain("Test message");
      expect(writtenContent).toContain("[TestLogger]");
    });

    it("should use custom filenames when configured", () => {
      const adapter = new FileLoggerAdapter({
        combinedFilename: "app.log",
        errorFilename: "app-errors.log",
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.ERROR, message: "Error", name: "Test" });

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("app.log"),
        expect.any(String),
        "utf8"
      );
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("app-errors.log"),
        expect.any(String),
        "utf8"
      );
    });

    it("should filter logs below minimum level", () => {
      const adapter = new FileLoggerAdapter();
      adapter.initialize({ minLevel: LOG_LEVEL.ERROR });

      adapter.log({ level: LOG_LEVEL.INFO, message: "Info", name: "Test" });
      adapter.log({ level: LOG_LEVEL.WARN, message: "Warn", name: "Test" });
      adapter.log({ level: LOG_LEVEL.DEBUG, message: "Debug", name: "Test" });

      expect(mockFs.appendFileSync).not.toHaveBeenCalled();
    });

    it("should lazy initialize directory on first log", () => {
      mockFs.existsSync.mockReturnValue(false);

      const adapter = new FileLoggerAdapter({ directory: "./lazy-logs" });
      // Don't call initialize()

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("lazy-logs"), {
        recursive: true,
      });
    });
  });

  describe("rotation", () => {
    it("should rotate file when size exceeds maxFileSize", () => {
      mockFs.statSync.mockReturnValue(createMockStats({ size: 11 * 1024 * 1024 })); // 11MB

      const adapter = new FileLoggerAdapter({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(mockFs.renameSync).toHaveBeenCalled();
    });

    it("should not rotate file when size is below maxFileSize", () => {
      mockFs.statSync.mockReturnValue(createMockStats({ size: 5 * 1024 * 1024 })); // 5MB

      const adapter = new FileLoggerAdapter({
        maxFileSize: 10 * 1024 * 1024, // 10MB
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it("should rename current file to .1 during rotation", () => {
      mockFs.statSync.mockReturnValue(createMockStats({ size: 15 * 1024 * 1024 }));
      mockFs.existsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // Only the main file exists, no rotated files
        return !pathStr.includes(".1") && !pathStr.includes(".2");
      });

      const adapter = new FileLoggerAdapter({
        directory: "./logs",
        maxFileSize: 10 * 1024 * 1024,
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(mockFs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining("combined.log"),
        expect.stringContaining("combined.log.1")
      );
    });

    it("should shift existing rotated files", () => {
      mockFs.statSync.mockReturnValue(createMockStats({ size: 15 * 1024 * 1024 }));
      mockFs.existsSync.mockImplementation((p) => {
        const pathStr = p.toString();
        // Main file and .1 exist
        return !pathStr.includes(".2") && !pathStr.includes(".3");
      });

      const adapter = new FileLoggerAdapter({
        directory: "./logs",
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      // Should rename .1 to .2
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining("combined.log.1"),
        expect.stringContaining("combined.log.2")
      );
    });

    it("should delete oldest file when maxFiles is exceeded", () => {
      mockFs.statSync.mockReturnValue(createMockStats({ size: 15 * 1024 * 1024 }));
      mockFs.existsSync.mockReturnValue(true); // All files exist

      const adapter = new FileLoggerAdapter({
        directory: "./logs",
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 3,
      });
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      // Should delete .2 (oldest when maxFiles=3)
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining("combined.log.2"));
    });

    it("should not rotate if file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const adapter = new FileLoggerAdapter();
      adapter.initialize({});

      adapter.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Test" });

      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });
  });

  describe("child", () => {
    it("should create child adapter with name", () => {
      const parent = new FileLoggerAdapter();
      parent.initialize({});

      const child = parent.child("ChildLogger");
      child.log({ level: LOG_LEVEL.INFO, message: "Child message", name: "" });

      const writtenContent = getWrittenContentAt(0);
      expect(writtenContent).toContain("ChildLogger");
    });

    it("should inherit parent configuration", () => {
      const parent = new FileLoggerAdapter({
        directory: "./custom-logs",
        maxFileSize: 5 * 1024 * 1024,
        format: "pretty",
      });
      parent.initialize({ minLevel: LOG_LEVEL.WARN });

      const child = parent.child("Child");

      // DEBUG should be filtered (inherited from parent)
      child.log({ level: LOG_LEVEL.DEBUG, message: "Debug", name: "Child" });
      expect(mockFs.appendFileSync).not.toHaveBeenCalled();

      // WARN should pass
      child.log({ level: LOG_LEVEL.WARN, message: "Warn", name: "Child" });
      expect(mockFs.appendFileSync).toHaveBeenCalled();

      // Should use custom directory
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("custom-logs"),
        expect.any(String),
        "utf8"
      );
    });

    it("should merge parent and child metadata", () => {
      const parent = new FileLoggerAdapter();
      parent.initialize({});

      // Create parent with metadata via child
      const parentWithMeta = parent.child("Parent", { service: "api" });
      const child = parentWithMeta.child("Child", { component: "auth" });

      child.log({ level: LOG_LEVEL.INFO, message: "Test", name: "Child" });

      const writtenContent = getWrittenContentAt(0);
      expect(writtenContent).toContain("service");
      expect(writtenContent).toContain("component");
    });
  });

  describe("flush", () => {
    it("should resolve immediately (sync writes)", async () => {
      const adapter = new FileLoggerAdapter();
      await expect(adapter.flush()).resolves.toBeUndefined();
    });
  });

  describe("destroy", () => {
    it("should resolve immediately (no resources)", async () => {
      const adapter = new FileLoggerAdapter();
      await expect(adapter.destroy()).resolves.toBeUndefined();
    });
  });
});

describe("FileLoggerAdapter with BufferedLoggerAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue(createMockStats());
    mockFs.appendFileSync.mockImplementation(() => undefined);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.renameSync.mockImplementation(() => undefined);
    mockFs.unlinkSync.mockImplementation(() => undefined);
  });

  it("should write logs when wrapped and flushed", async () => {
    const fileAdapter = new FileLoggerAdapter({ directory: "./logs" });
    const buffered = new BufferedLoggerAdapter(fileAdapter, {
      maxBufferSize: 10,
      flushIntervalMs: 1000,
    });
    buffered.initialize({});

    buffered.log({
      level: LOG_LEVEL.INFO,
      message: "Buffered then file",
      name: "Test",
      timestamp: new Date().toISOString(),
    });
    expect(mockFs.appendFileSync).not.toHaveBeenCalled();

    await buffered.flush();
    expect(mockFs.appendFileSync).toHaveBeenCalledTimes(1);
    expect(mockFs.appendFileSync).toHaveBeenCalledWith(
      expect.stringContaining("combined.log"),
      expect.stringContaining("Buffered then file"),
      "utf8"
    );

    await buffered.destroy();
  });
});

describe("createFileAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue(createMockStats());
  });

  it("should create adapter with default config", () => {
    const adapter = createFileAdapter();
    expect(adapter).toBeInstanceOf(FileLoggerAdapter);
  });

  it("should create adapter with custom config", () => {
    const adapter = createFileAdapter({
      directory: "./custom",
      maxFileSize: 1024,
    });
    expect(adapter).toBeInstanceOf(FileLoggerAdapter);
  });
});

describe("FILE_TRANSPORT_DEFAULTS", () => {
  it("should have expected default values", () => {
    expect(FILE_TRANSPORT_DEFAULTS.DIRECTORY).toBe("./logs");
    expect(FILE_TRANSPORT_DEFAULTS.COMBINED_FILENAME).toBe("combined.log");
    expect(FILE_TRANSPORT_DEFAULTS.ERROR_FILENAME).toBe("error.log");
    expect(FILE_TRANSPORT_DEFAULTS.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(FILE_TRANSPORT_DEFAULTS.MAX_FILES).toBe(5);
  });
});
