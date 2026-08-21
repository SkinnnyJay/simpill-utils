/**
 * @file File Adapter Uplift Unit Tests
 * @description Cached-size writes (no stat-per-write), rotation cache reset,
 *              safe serialization, level gate.
 */

import * as fs from "node:fs";
import { FileLoggerAdapter } from "../../src/adapters/file.adapter";
import { LOG_LEVEL } from "../../src/shared/constants";

jest.mock("node:fs");
const mockFs = fs as jest.Mocked<typeof fs>;

function createMockStats(overrides: { size?: number } = {}): fs.Stats {
  return { size: 0, ...overrides } as fs.Stats;
}

describe("FileLoggerAdapter uplift", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue(createMockStats());
    mockFs.appendFileSync.mockImplementation(() => undefined);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.renameSync.mockImplementation(() => undefined);
    mockFs.unlinkSync.mockImplementation(() => undefined);
  });

  it("stats each file ONCE, not on every write (frozen: existsSync+statSync per line)", () => {
    const adapter = new FileLoggerAdapter();
    adapter.initialize({});

    for (let i = 0; i < 100; i++) {
      adapter.log({ level: LOG_LEVEL.INFO, message: `m${i}`, name: "t" });
    }

    // 100 writes to combined.log -> exactly 1 stat (first write), not 100
    expect(mockFs.statSync).toHaveBeenCalledTimes(1);
    expect(mockFs.appendFileSync).toHaveBeenCalledTimes(100);
  });

  it("tracks appended bytes and rotates without re-statting", () => {
    mockFs.statSync.mockReturnValue(createMockStats({ size: 0 }));
    const adapter = new FileLoggerAdapter({ maxFileSize: 200 });
    adapter.initialize({});

    // Each JSON line is well over 66 bytes; 4 writes must cross 200 bytes
    for (let i = 0; i < 4; i++) {
      adapter.log({
        level: LOG_LEVEL.INFO,
        message: "a-reasonably-long-log-message-for-byte-counting",
        name: "ByteTracker",
        timestamp: "2026-07-03T00:00:00.000Z",
      });
    }

    expect(mockFs.renameSync).toHaveBeenCalled(); // rotation happened from CACHED size
    expect(mockFs.statSync).toHaveBeenCalledTimes(1); // still only the initial stat
  });

  it("resets the cached size to 0 after rotation (no rotation loop)", () => {
    mockFs.statSync.mockReturnValue(createMockStats({ size: 11 * 1024 * 1024 }));
    const adapter = new FileLoggerAdapter({ maxFileSize: 10 * 1024 * 1024 });
    adapter.initialize({});

    adapter.log({ level: LOG_LEVEL.INFO, message: "first", name: "t" }); // rotates
    mockFs.renameSync.mockClear();
    adapter.log({ level: LOG_LEVEL.INFO, message: "second", name: "t" }); // fresh file

    expect(mockFs.renameSync).not.toHaveBeenCalled();
  });

  it("children share the size cache (bytes counted once per file)", () => {
    const parent = new FileLoggerAdapter();
    parent.initialize({});
    const child = parent.child("Child");

    parent.log({ level: LOG_LEVEL.INFO, message: "p", name: "P" });
    child.log({ level: LOG_LEVEL.INFO, message: "c", name: "C" });

    // one stat for combined.log across BOTH writers
    expect(mockFs.statSync).toHaveBeenCalledTimes(1);
  });

  it("circular metadata is serialized safely instead of throwing (json format)", () => {
    const adapter = new FileLoggerAdapter({ format: "json" });
    adapter.initialize({});
    const meta: Record<string, unknown> = { a: 1 };
    meta.self = meta;

    expect(() =>
      adapter.log({ level: LOG_LEVEL.INFO, message: "msg", name: "t", metadata: meta })
    ).not.toThrow();

    const written = mockFs.appendFileSync.mock.calls[0]?.[1] as string;
    expect(written).toContain('"message":"msg"');
    expect(written).toContain("[Circular]");
  });

  it("exposes the fast level gate", () => {
    const adapter = new FileLoggerAdapter();
    adapter.initialize({ minLevel: LOG_LEVEL.WARN });
    expect(adapter.isLevelEnabled(LOG_LEVEL.DEBUG)).toBe(false);
    expect(adapter.isLevelEnabled(LOG_LEVEL.ERROR)).toBe(true);
  });
});
