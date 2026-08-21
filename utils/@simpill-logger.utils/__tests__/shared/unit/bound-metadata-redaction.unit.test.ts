import type { LoggerAdapter } from "../../../src/shared/adapter";
import { getLogger, LoggerFactory } from "../../../src/shared/factory";
import type { LogEntry, LogMetadata } from "../../../src/shared/types";

/**
 * Redaction runs on per-call metadata inside the log methods, but default and child metadata is
 * merged back in by the adapter afterwards. A secret bound once at logger creation was therefore
 * emitted verbatim on every line that logger ever wrote, while the identical key passed per-call
 * was redacted.
 */
describe("bound metadata redaction", () => {
  let captured: LogEntry[];

  const makeAdapter = (bound?: LogMetadata): LoggerAdapter => ({
    initialize: jest.fn(),
    log: (entry: LogEntry) => {
      captured.push({ ...entry, metadata: { ...bound, ...entry.metadata } });
    },
    child: (_name: string, metadata?: LogMetadata) => makeAdapter({ ...bound, ...metadata }),
  });

  beforeEach(async () => {
    captured = [];
    await LoggerFactory.reset();
    LoggerFactory.setAdapter(makeAdapter());
  });

  afterEach(async () => {
    await LoggerFactory.reset();
  });

  it("redacts secrets supplied as default metadata", () => {
    getLogger("Svc", { token: "SECRET-DEFAULT", userId: "u1" }).info("hello");

    expect(captured[0]?.metadata?.token).toBe("[REDACTED]");
    expect(captured[0]?.metadata?.userId).toBe("u1");
  });

  it("redacts secrets supplied to child()", () => {
    const child = getLogger("Svc2").child?.({ apiKey: "SECRET-CHILD", reqId: "r1" });
    expect(child).toBeDefined();
    child?.info("world");

    expect(captured[0]?.metadata?.apiKey).toBe("[REDACTED]");
    expect(captured[0]?.metadata?.reqId).toBe("r1");
  });

  it("keeps redacting per-call metadata", () => {
    getLogger("Svc3").info("hi", { password: "p" });

    expect(captured[0]?.metadata?.password).toBe("[REDACTED]");
  });
});
