/**
 * @file Buffered Adapter Uplift Unit Tests
 * @description Duplicate-delivery fix, bounded retry buffer, serialized flushes.
 */

import type { LoggerAdapter } from "../../../src/shared/adapter";
import { BufferedLoggerAdapter } from "../../../src/shared/buffered-adapter";
import { ERROR_MESSAGES, LOG_LEVEL, type LogLevel } from "../../../src/shared/constants";
import type { LogEntry } from "../../../src/shared/types";

const mk = (m: string): LogEntry => ({ level: LOG_LEVEL.INFO, message: m, name: "t" });

describe("BufferedLoggerAdapter uplift", () => {
  it("does NOT redeliver entries the inner adapter already accepted (mid-batch failure)", async () => {
    const delivered: string[] = [];
    let failOnce = true;
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(e: LogEntry): void {
        if (failOnce && e.message === "m2") {
          failOnce = false;
          throw new Error("transient");
        }
        delivered.push(e.message);
      },
      child(): LoggerAdapter {
        return this;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, { maxBufferSize: 100, flushIntervalMs: 60000 });
    buf.initialize({});
    buf.log(mk("m1"));
    buf.log(mk("m2"));
    buf.log(mk("m3"));

    await buf.flush(); // m1 delivered; m2 fails -> only m2+m3 requeued
    await buf.flush(); // retry delivers m2, m3
    await buf.destroy();

    expect(delivered).toEqual(["m1", "m2", "m3"]); // frozen code produced ["m1","m1","m2","m3"]
  });

  it("reports only the UNDELIVERED remainder to onFlushError", async () => {
    const onFlushError = jest.fn();
    let shouldThrow = true;
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(e: LogEntry): void {
        if (shouldThrow && e.message === "m3") {
          shouldThrow = false;
          throw new Error("boom");
        }
      },
      child(): LoggerAdapter {
        return this;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, {
      maxBufferSize: 100,
      flushIntervalMs: 60000,
      onFlushError,
    });
    buf.initialize({});
    for (const m of ["m1", "m2", "m3", "m4"]) {
      buf.log(mk(m));
    }
    await buf.flush();

    expect(onFlushError).toHaveBeenCalledTimes(1);
    const [, entries] = onFlushError.mock.calls[0] as [unknown, LogEntry[]];
    expect(entries.map((e) => e.message)).toEqual(["m3", "m4"]);
    expect(buf.getBufferSize()).toBe(2);
    await buf.destroy();
  });

  it("bounds the retry buffer at 2x maxBufferSize when the inner adapter is dead", () => {
    const onFlushError = jest.fn();
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(): void {
        throw new Error("dead sink");
      },
      child(): LoggerAdapter {
        return this;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, {
      maxBufferSize: 10,
      flushIntervalMs: 60000,
      onFlushError,
    });
    buf.initialize({});

    for (let i = 0; i < 500; i++) {
      buf.log(mk(`m${i}`));
    }

    // frozen behavior: buffer grew to 500 (unbounded); now capped at 2x
    expect(buf.getBufferSize()).toBeLessThanOrEqual(20);
    const overflowCalls = onFlushError.mock.calls.filter(
      ([err]) => (err as Error).message === ERROR_MESSAGES.BUFFER_OVERFLOW
    );
    expect(overflowCalls.length).toBeGreaterThan(0);
  });

  it("serializes concurrent flushes: awaiting flush() waits for in-flight delivery", async () => {
    const delivered: string[] = [];
    let release: () => void = () => {};
    const innerFlushGate = new Promise<void>((r) => {
      release = r;
    });
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(e: LogEntry): void {
        delivered.push(e.message);
      },
      child(): LoggerAdapter {
        return this;
      },
      async flush(): Promise<void> {
        await innerFlushGate;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, { maxBufferSize: 100, flushIntervalMs: 60000 });
    buf.initialize({});
    buf.log(mk("a"));

    const first = buf.flush(); // hangs on inner.flush
    buf.log(mk("b"));
    const second = buf.flush(); // frozen code resolved immediately, dropping the wait

    let secondResolved = false;
    void second.then(() => {
      secondResolved = true;
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(secondResolved).toBe(false); // must wait for the in-flight flush

    release();
    await first;
    await second;
    expect(delivered).toEqual(["a", "b"]);
    await buf.destroy();
  });

  it("delegates isLevelEnabled to the inner adapter (buffering keeps the fast gate)", () => {
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(): void {},
      child(): LoggerAdapter {
        return this;
      },
      isLevelEnabled(level: LogLevel): boolean {
        return level === LOG_LEVEL.ERROR;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, {});
    expect(buf.isLevelEnabled(LOG_LEVEL.ERROR)).toBe(true);
    expect(buf.isLevelEnabled(LOG_LEVEL.DEBUG)).toBe(false);
    const child = buf.child("c") as LoggerAdapter;
    expect(child.isLevelEnabled?.(LOG_LEVEL.DEBUG)).toBe(false);
  });

  it("inner adapters without a gate are treated as fully enabled", () => {
    const inner: LoggerAdapter = {
      initialize(): void {},
      log(): void {},
      child(): LoggerAdapter {
        return this;
      },
    };
    const buf = new BufferedLoggerAdapter(inner, {});
    expect(buf.isLevelEnabled(LOG_LEVEL.DEBUG)).toBe(true);
  });
});

describe("BufferedLoggerAdapter throwing onFlushError handler", () => {
  const makeInner = (state: { fail: boolean; delivered: string[] }): LoggerAdapter => ({
    initialize(): void {},
    log(e: LogEntry): void {
      if (state.fail) {
        throw new Error("sink down");
      }
      state.delivered.push(e.message);
    },
    child(): LoggerAdapter {
      throw new Error("unused");
    },
    isLevelEnabled(_level: LogLevel): boolean {
      return true;
    },
  });

  it("never rejects flush(), and keeps flushing after the handler throws", async () => {
    const state = { fail: true, delivered: [] as string[] };
    const buf = new BufferedLoggerAdapter(makeInner(state), {
      onFlushError: (): void => {
        throw new Error("user handler bug");
      },
    });

    buf.log(mk("m1"));
    await expect(buf.flush()).resolves.toBeUndefined();

    buf.log(mk("m2"));
    await expect(buf.flush()).resolves.toBeUndefined();

    // The sink recovers; the retained backlog must still drain rather than stay
    // wedged behind a permanently rejected pendingFlush chain.
    state.fail = false;
    await expect(buf.flush()).resolves.toBeUndefined();
    expect(state.delivered).toEqual(["m1", "m2"]);
  });

  it("still drains the buffer on destroy() after the handler threw", async () => {
    const state = { fail: true, delivered: [] as string[] };
    const buf = new BufferedLoggerAdapter(makeInner(state), {
      onFlushError: (): void => {
        throw new Error("user handler bug");
      },
    });

    buf.log(mk("m1"));
    await buf.flush();
    state.fail = false;

    await expect(buf.destroy()).resolves.toBeUndefined();
    expect(state.delivered).toEqual(["m1"]);
  });
});
