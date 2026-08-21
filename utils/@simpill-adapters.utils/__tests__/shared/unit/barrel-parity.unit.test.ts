// LogPayload was exported from ./shared but omitted from the root, client,
// and server barrels. These type-only imports make tsc enforce the fix:
import type { LogPayload as ClientLogPayload } from "../../../src/client";
import * as client from "../../../src/client";
import type { LogPayload as RootLogPayload } from "../../../src/index";
import * as root from "../../../src/index";
import type { LogPayload as ServerLogPayload } from "../../../src/server";
import * as server from "../../../src/server";
import * as shared from "../../../src/shared";

const _typeCheck: RootLogPayload & ClientLogPayload & ServerLogPayload = {
  message: "compiles",
};

describe("barrel parity", () => {
  const names = (mod: object) => Object.keys(mod).sort();

  it("root, client, and server export the identical value surface as shared", () => {
    const sharedNames = names(shared);
    expect(names(root)).toEqual(sharedNames);
    expect(names(client)).toEqual(sharedNames);
    expect(names(server)).toEqual(sharedNames);
  });

  it("the shared surface includes every adapter helper", () => {
    for (const name of [
      "asAsyncCacheAdapter",
      "consoleLoggerAdapter",
      "createAdapter",
      "LOG_LEVELS",
      "levelFilterLoggerAdapter",
      "memoryCacheAdapter",
      "namespacedCacheAdapter",
      "noopCacheAdapter",
      "noopLoggerAdapter",
      "prefixLoggerAdapter",
      "scopedAdapter",
    ]) {
      expect(names(shared)).toContain(name);
    }
    expect(_typeCheck.message).toBe("compiles");
  });
});
