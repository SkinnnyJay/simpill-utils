import {
  clearLogContextProvider,
  getLogContext,
  hasLogContextProvider,
  setLogContextProvider,
} from "@simpill/logger.utils";
import { runWithRequestContext } from "@simpill/request-context.utils/server";
import { setupObservability } from "../../../src/server/setup-observability";

describe("setupObservability options and handle", () => {
  afterEach(() => {
    clearLogContextProvider();
  });

  it("installs getRequestContext as the provider (original behavior)", async () => {
    setupObservability();
    expect(hasLogContextProvider()).toBe(true);
    await runWithRequestContext({ requestId: "req-1", traceId: "trace-1" }, async () => {
      expect(getLogContext()).toEqual({ requestId: "req-1", traceId: "trace-1" });
    });
    expect(getLogContext()).toBeUndefined();
  });

  it("returns an inactive handle and touches nothing when setLogContextProvider is false", () => {
    const handle = setupObservability({ setLogContextProvider: false });
    expect(hasLogContextProvider()).toBe(false);
    expect(handle.active).toBe(false);
    expect(handle.replacedExistingProvider).toBe(false);
    expect(() => handle.teardown()).not.toThrow();
    expect(hasLogContextProvider()).toBe(false);
  });

  it("teardown() uninstalls the provider", () => {
    const handle = setupObservability();
    expect(hasLogContextProvider()).toBe(true);
    expect(handle.active).toBe(true);
    handle.teardown();
    expect(handle.active).toBe(false);
    expect(hasLogContextProvider()).toBe(false);
  });

  it("a superseded handle's teardown cannot clobber the newer setup", () => {
    const first = setupObservability();
    const second = setupObservability({ baseContext: { service: "svc" } });
    expect(first.active).toBe(false);
    first.teardown(); // stale teardown — must be a no-op
    expect(hasLogContextProvider()).toBe(true);
    expect(getLogContext()).toEqual({ service: "svc" });
    second.teardown();
    expect(hasLogContextProvider()).toBe(false);
  });

  it("reports replacedExistingProvider when overwriting prior wiring", () => {
    setLogContextProvider(() => ({ custom: true }));
    const handle = setupObservability();
    expect(handle.replacedExistingProvider).toBe(true);
    expect(getLogContext()).toBeUndefined(); // now getRequestContext outside a request
  });

  it('onExistingProvider: "keep" leaves existing wiring untouched', () => {
    setLogContextProvider(() => ({ custom: true }));
    const handle = setupObservability({ onExistingProvider: "keep" });
    expect(handle.active).toBe(false);
    expect(getLogContext()).toEqual({ custom: true });
    handle.teardown(); // no-op
    expect(getLogContext()).toEqual({ custom: true });
  });

  it('onExistingProvider: "throw" fails loudly on double-wiring', () => {
    setLogContextProvider(() => ({ custom: true }));
    expect(() => setupObservability({ onExistingProvider: "throw" })).toThrow(/already installed/);
    expect(getLogContext()).toEqual({ custom: true });
  });

  it("baseContext enriches logs outside any request", () => {
    setupObservability({ baseContext: { service: "api", env: "test" } });
    expect(getLogContext()).toEqual({ service: "api", env: "test" });
  });

  it("request context wins over baseContext on key conflicts", async () => {
    setupObservability({ baseContext: { service: "api", traceId: "static-should-lose" } });
    await runWithRequestContext({ requestId: "req-2", traceId: "trace-2" }, async () => {
      expect(getLogContext()).toEqual({
        service: "api",
        requestId: "req-2",
        traceId: "trace-2",
      });
    });
  });

  it("baseContext is copied, not referenced (later mutation has no effect)", () => {
    const base = { service: "api" };
    setupObservability({ baseContext: base });
    base.service = "mutated";
    expect(getLogContext()).toEqual({ service: "api" });
  });

  it("extendContext composes between baseContext and request context", async () => {
    setupObservability({
      baseContext: { service: "api", layer: "base" },
      extendContext: () => ({ layer: "extend", spanId: "span-x" }),
    });
    expect(getLogContext()).toEqual({ service: "api", layer: "extend", spanId: "span-x" });
    await runWithRequestContext({ requestId: "req-3", layer: "request" }, async () => {
      expect(getLogContext()).toEqual({
        service: "api",
        layer: "request",
        spanId: "span-x",
        requestId: "req-3",
      });
    });
  });

  it("a throwing extendContext never breaks context reads (logger guarantee)", () => {
    setupObservability({
      baseContext: { service: "api" },
      extendContext: () => {
        throw new Error("otel bridge exploded");
      },
    });
    // getLogContext swallows provider errors by contract.
    expect(getLogContext()).toBeUndefined();
  });
});
