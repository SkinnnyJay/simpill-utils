import { getRequestContext, runWithRequestContextSync } from "../../../src/server";

/**
 * Duplicate-copy safety: npm dedupe failures / monorepo double-installs load
 * this module TWICE in one process. With a module-level default store each
 * copy gets its own invisible store, so context set through copy A is
 * undefined when read through copy B. The default store is anchored on a
 * Symbol.for() global-registry key precisely so both copies share one store.
 * jest.isolateModules simulates the second copy (fresh module registry,
 * same globalThis).
 */
describe("default store survives duplicate package copies", () => {
  it("a second module copy sees context set by the first", () => {
    let secondCopyGet: (() => Record<string, unknown> | undefined) | undefined;
    jest.isolateModules(() => {
      // Fresh module instance = what a duplicated node_modules copy gets.
      secondCopyGet = require("../../../src/server").getRequestContext;
    });
    expect(secondCopyGet).toBeDefined();
    expect(secondCopyGet).not.toBe(getRequestContext); // genuinely a distinct copy
    const seenByOtherCopy = runWithRequestContextSync({ requestId: "shared-1" }, () => {
      return secondCopyGet?.()?.requestId;
    });
    expect(seenByOtherCopy).toBe("shared-1");
  });
});
