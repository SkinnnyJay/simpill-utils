import {
  clearLogContextProvider,
  getLogger,
  type LogEntry,
  resetLoggerFactory,
  setLoggerAdapter,
} from "@simpill/logger.utils";
import { runWithRequestContext } from "@simpill/request-context.utils/server";
import { setupObservability } from "../../../src/server/setup-observability";
import { formatTraceparent, traceContextFromHeaders } from "../../../src/server/trace-context";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const PARENT_ID = "00f067aa0ba902b7";

describe("observability end-to-end: headers -> request context -> log entries", () => {
  let entries: LogEntry[];

  function captureAdapter(): {
    initialize: () => void;
    log: (entry: LogEntry) => void;
    child: (name: string) => ReturnType<typeof captureAdapter>;
  } {
    const adapter = {
      initialize: () => {},
      log: (entry: LogEntry) => {
        entries.push(entry);
      },
      child: (_name: string) => adapter,
    };
    return adapter;
  }

  // resetLoggerFactory is async: when the previous adapter has a destroy(), it
  // awaits, deferring its own `globalAdapter = null` to a microtask. Awaiting
  // here guarantees that reset completes before we install the capture adapter,
  // otherwise the deferred null clobbers it and logs fall back to the console.
  beforeEach(async () => {
    entries = [];
    await resetLoggerFactory();
    setLoggerAdapter(captureAdapter());
  });

  afterEach(async () => {
    clearLogContextProvider();
    await resetLoggerFactory();
  });

  it("logs inside a request carry requestId/traceId without per-call plumbing", async () => {
    setupObservability();
    const logger = getLogger("integration");
    await runWithRequestContext({ requestId: "req-42", traceId: TRACE_ID }, async () => {
      logger.info("inside request");
    });
    logger.info("outside request");

    expect(entries).toHaveLength(2);
    expect(entries[0]?.metadata).toMatchObject({ requestId: "req-42", traceId: TRACE_ID });
    expect(entries[1]?.metadata?.requestId).toBeUndefined();
  });

  it("W3C headers flow into log entries via traceContextFromHeaders", async () => {
    setupObservability({ baseContext: { service: "checkout" } });
    const logger = getLogger("integration");
    const traceparent = formatTraceparent({
      traceId: TRACE_ID,
      parentId: PARENT_ID,
      sampled: true,
    });

    const ctx = traceContextFromHeaders({ traceparent, tracestate: "congo=t61rcWkgMzE" });
    expect(ctx).not.toBeNull();
    if (!ctx) return;

    await runWithRequestContext({ requestId: "req-7", ...ctx }, async () => {
      logger.info("handling request");
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.metadata).toMatchObject({
      service: "checkout",
      requestId: "req-7",
      traceId: TRACE_ID,
      spanId: PARENT_ID,
      sampled: true,
      tracestate: "congo=t61rcWkgMzE",
    });
  });

  it("per-call metadata wins over context on key conflicts (logger contract)", async () => {
    setupObservability({ baseContext: { service: "checkout", region: "us-west" } });
    const logger = getLogger("integration");
    await runWithRequestContext({ requestId: "req-9" }, async () => {
      logger.warn("override", { region: "eu-central" });
    });
    expect(entries[0]?.metadata).toMatchObject({
      service: "checkout",
      requestId: "req-9",
      region: "eu-central",
    });
  });

  it("teardown() stops enrichment for subsequent logs", async () => {
    const handle = setupObservability({ baseContext: { service: "checkout" } });
    const logger = getLogger("integration");
    logger.info("enriched");
    handle.teardown();
    logger.info("bare");
    expect(entries[0]?.metadata).toMatchObject({ service: "checkout" });
    expect(entries[1]?.metadata).toBeUndefined();
  });
});
