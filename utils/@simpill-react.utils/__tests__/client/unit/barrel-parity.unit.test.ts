/**
 * @file Barrel parity: every client export reachable from the root barrel.
 */

import * as client from "../../../src/client";
import * as root from "../../../src/index";

describe("barrel parity", () => {
  it("root barrel re-exports the full client surface", () => {
    for (const key of Object.keys(client)) {
      expect(root).toHaveProperty(key);
    }
  });

  it("expected exports are present", () => {
    const expected = [
      "createSafeContext",
      "useSafeContext",
      "useDeferredUpdate",
      "useEffectEvent",
      "useIsomorphicLayoutEffect",
      "useLatest",
      "useLazyState",
      "useStableCallback",
    ];
    for (const name of expected) {
      expect(typeof (client as Record<string, unknown>)[name]).toBeDefined();
      expect((client as Record<string, unknown>)[name]).toBeTruthy();
    }
  });
});
