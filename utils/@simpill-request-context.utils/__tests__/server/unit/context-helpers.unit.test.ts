import { EventEmitter } from "node:events";
import {
  bindRequestContext,
  createRequestContextStore,
  getRequestContext,
  getRequestContextValue,
  RequestContextUnavailableError,
  requireRequestContext,
  runWithChildRequestContext,
  runWithRequestContext,
  runWithRequestContextSync,
  setRequestContextValue,
  updateRequestContext,
} from "../../../src/server";

describe("runAsync Promise contract", () => {
  it("store.runAsync converts a sync throw into a rejection", async () => {
    const store = createRequestContextStore();
    const fn = (() => {
      throw new Error("boom");
    }) as unknown as () => Promise<void>;
    let syncThrew = false;
    let promise: Promise<void> | undefined;
    try {
      promise = store.runAsync({ requestId: "x" }, fn);
    } catch {
      syncThrew = true;
    }
    expect(syncThrew).toBe(false);
    await expect(promise).rejects.toThrow("boom");
  });

  it("runWithRequestContext converts a sync throw into a rejection", async () => {
    await expect(
      runWithRequestContext({ requestId: "x" }, () => {
        throw new Error("sync-boom");
      }),
    ).rejects.toThrow("sync-boom");
  });
});

describe("runWithRequestContextSync", () => {
  it("returns synchronously with context visible", () => {
    const out = runWithRequestContextSync({ requestId: "s1" }, () => {
      return getRequestContext()?.requestId;
    });
    expect(out).toBe("s1"); // no await needed — value, not a Promise
  });

  it("propagates sync throws directly", () => {
    expect(() =>
      runWithRequestContextSync({ requestId: "s2" }, () => {
        throw new Error("direct");
      }),
    ).toThrow("direct");
    expect(getRequestContext()).toBeUndefined();
  });
});

describe("requireRequestContext", () => {
  it("throws RequestContextUnavailableError outside a run", () => {
    expect(() => requireRequestContext()).toThrow(RequestContextUnavailableError);
  });

  it("returns the context inside a run", () => {
    const out = runWithRequestContextSync({ requestId: "r" }, () => requireRequestContext());
    expect(out.requestId).toBe("r");
  });
});

describe("updateRequestContext / value helpers", () => {
  it("update is visible to earlier readers and across await", async () => {
    await runWithRequestContext({ requestId: "u1" }, async () => {
      const early = getRequestContext();
      expect(updateRequestContext({ userId: "user-42" })).toBe(true);
      await Promise.resolve();
      expect(getRequestContext()?.userId).toBe("user-42");
      expect(early?.userId).toBe("user-42"); // same store object, enriched in place
    });
  });

  it("returns false outside a run and mutates nothing", () => {
    expect(updateRequestContext({ userId: "nope" })).toBe(false);
    expect(getRequestContext()).toBeUndefined();
  });

  it("set/getRequestContextValue round-trip", () => {
    runWithRequestContextSync({ requestId: "v" }, () => {
      expect(setRequestContextValue("tenantId", "t-9")).toBe(true);
      expect(getRequestContextValue<string>("tenantId")).toBe("t-9");
    });
    expect(setRequestContextValue("tenantId", "t-9")).toBe(false);
    expect(getRequestContextValue("tenantId")).toBeUndefined();
  });
});

describe("runWithChildRequestContext", () => {
  it("inherits parent fields, patch wins, parent never mutated or aliased", () => {
    runWithRequestContextSync({ requestId: "p", traceId: "t" }, () => {
      const parent = getRequestContext();
      runWithChildRequestContext({ userId: "child-u", traceId: "t2" }, () => {
        const child = getRequestContext();
        expect(child?.requestId).toBe("p"); // inherited
        expect(child?.traceId).toBe("t2"); // patch wins
        expect(child?.userId).toBe("child-u");
        expect(child).not.toBe(parent); // no aliasing
        updateRequestContext({ userId: "mutated" });
      });
      expect(getRequestContext()).toBe(parent); // parent restored
      expect(parent?.userId).toBeUndefined(); // child mutation never leaked
      expect(parent?.traceId).toBe("t");
    });
  });

  it("works with no parent (acts like a plain run)", () => {
    const out = runWithChildRequestContext({ requestId: "orphan" }, () => getRequestContext());
    expect(out?.requestId).toBe("orphan");
  });
});

describe("bindRequestContext", () => {
  it("restores context in an EventEmitter listener that fires after the run", async () => {
    const emitter = new EventEmitter();
    let seen: string | undefined;
    runWithRequestContextSync({ requestId: "bind-1" }, () => {
      emitter.on(
        "later",
        bindRequestContext(() => {
          seen = getRequestContext()?.requestId;
        }),
      );
    });
    // Outside the run: an unbound listener would see undefined here.
    emitter.emit("later");
    expect(seen).toBe("bind-1");
  });

  it("unbound listener loses context (documents why bind exists)", () => {
    const emitter = new EventEmitter();
    let seen: string | undefined = "sentinel";
    runWithRequestContextSync({ requestId: "bind-2" }, () => {
      emitter.on("later", () => {
        seen = getRequestContext()?.requestId;
      });
    });
    emitter.emit("later");
    expect(seen).toBeUndefined();
  });

  it("passes through args/return and is identity outside a run", () => {
    const plain = (a: number, b: number) => a + b;
    expect(bindRequestContext(plain)).toBe(plain);
    const bound = runWithRequestContextSync({ requestId: "b" }, () => bindRequestContext(plain));
    expect(bound(2, 3)).toBe(5);
  });
});

describe("generic context shapes", () => {
  interface AppContext {
    requestId: string;
    role: "admin" | "user";
    [key: string]: unknown;
  }

  it("typed store and getters compile and work without casts", () => {
    const store = createRequestContextStore<AppContext>();
    const role = store.run({ requestId: "g", role: "admin" }, () => store.getStore()?.role);
    expect(role).toBe("admin");
    const viaDefault = runWithRequestContextSync({ requestId: "g2", role: "user" }, () => {
      return getRequestContext<AppContext>()?.role;
    });
    expect(viaDefault).toBe("user");
  });
});
