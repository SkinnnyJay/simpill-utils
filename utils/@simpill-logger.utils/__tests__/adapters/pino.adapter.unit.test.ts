/**
 * @file Pino Adapter Unit Tests
 * @description Tests for the optional Pino logger adapter
 */

import {
  createPinoAdapter,
  type PinoLike,
  PinoLoggerAdapter,
} from "../../src/adapters/pino.adapter";
import { LOG_LEVEL } from "../../src/shared/constants";

describe("PinoLoggerAdapter", () => {
  const createMockPino = (): PinoLike & {
    logs: Array<{ level: string; obj: object; msg?: string }>;
    children: Array<{ bindings: object; pino: PinoLike }>;
    flushed: boolean;
  } => {
    const logs: Array<{ level: string; obj: object; msg?: string }> = [];
    const children: Array<{ bindings: object; pino: PinoLike }> = [];
    let flushed = false;

    const mockPino: PinoLike & {
      logs: typeof logs;
      children: typeof children;
      flushed: boolean;
    } = {
      logs,
      children,
      flushed,
      info: (obj: object, msg?: string) => {
        logs.push({ level: "info", obj, msg });
      },
      warn: (obj: object, msg?: string) => {
        logs.push({ level: "warn", obj, msg });
      },
      debug: (obj: object, msg?: string) => {
        logs.push({ level: "debug", obj, msg });
      },
      error: (obj: object, msg?: string) => {
        logs.push({ level: "error", obj, msg });
      },
      child: (bindings: object): PinoLike => {
        const childPino = createMockPino();
        children.push({ bindings, pino: childPino });
        return childPino;
      },
      flush: () => {
        flushed = true;
        mockPino.flushed = true;
      },
    };

    return mockPino;
  };

  describe("constructor", () => {
    it("should create adapter with Pino instance", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);
      expect(adapter).toBeInstanceOf(PinoLoggerAdapter);
    });
  });

  describe("initialize", () => {
    it("should accept config (no-op for Pino)", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      // Should not throw
      expect(() => adapter.initialize({ minLevel: LOG_LEVEL.INFO })).not.toThrow();
    });
  });

  describe("log", () => {
    it("should call pino.info for INFO level", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Info message",
        name: "TestLogger",
      });

      expect(mockPino.logs).toHaveLength(1);
      expect(mockPino.logs[0].level).toBe("info");
      expect(mockPino.logs[0].msg).toBe("Info message");
      expect(mockPino.logs[0].obj).toEqual({ name: "TestLogger" });
    });

    it("should call pino.warn for WARN level", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.WARN,
        message: "Warning",
        name: "Test",
      });

      expect(mockPino.logs[0].level).toBe("warn");
    });

    it("should call pino.debug for DEBUG level", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.DEBUG,
        message: "Debug",
        name: "Test",
      });

      expect(mockPino.logs[0].level).toBe("debug");
    });

    it("should call pino.error for ERROR level", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.ERROR,
        message: "Error",
        name: "Test",
      });

      expect(mockPino.logs[0].level).toBe("error");
    });

    it("should include metadata in log object", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Logger",
        metadata: { userId: "123", action: "login" },
      });

      expect(mockPino.logs[0].obj).toEqual({
        name: "Logger",
        userId: "123",
        action: "login",
      });
    });

    it("should include timestamp when provided", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "Test",
        name: "Logger",
        timestamp: "2024-01-01T00:00:00.000Z",
      });

      expect(mockPino.logs[0].obj).toEqual({
        name: "Logger",
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });
  });

  describe("child", () => {
    it("should create child logger with name", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      const childAdapter = adapter.child("ChildService");

      expect(mockPino.children).toHaveLength(1);
      expect(mockPino.children[0].bindings).toEqual({ name: "ChildService" });
      expect(childAdapter).toBeInstanceOf(PinoLoggerAdapter);
    });

    it("should include default metadata in child bindings", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      adapter.child("Child", { service: "api", version: "1.0" });

      expect(mockPino.children[0].bindings).toEqual({
        name: "Child",
        service: "api",
        version: "1.0",
      });
    });

    it("should return functional child adapter", () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      const childAdapter = adapter.child("Child");
      childAdapter.log({
        level: LOG_LEVEL.INFO,
        message: "Child log",
        name: "Child",
      });

      // The child's mock pino should have the log
      const childMock = mockPino.children[0].pino as ReturnType<typeof createMockPino>;
      expect(childMock.logs).toHaveLength(1);
      expect(childMock.logs[0].msg).toBe("Child log");
    });
  });

  describe("flush", () => {
    it("should call pino.flush if available", async () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      await adapter.flush();

      expect(mockPino.flushed).toBe(true);
    });

    it("should not throw if pino has no flush", async () => {
      const mockPino = createMockPino();
      delete (mockPino as Partial<PinoLike>).flush;
      const adapter = new PinoLoggerAdapter(mockPino);

      await expect(adapter.flush()).resolves.toBeUndefined();
    });
  });

  describe("destroy", () => {
    it("should resolve without error", async () => {
      const mockPino = createMockPino();
      const adapter = new PinoLoggerAdapter(mockPino);

      await expect(adapter.destroy()).resolves.toBeUndefined();
    });
  });
});

describe("createPinoAdapter", () => {
  it("should create adapter from Pino instance", () => {
    const mockPino: PinoLike = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };

    const adapter = createPinoAdapter(mockPino);
    expect(adapter).toBeInstanceOf(PinoLoggerAdapter);
  });
});
