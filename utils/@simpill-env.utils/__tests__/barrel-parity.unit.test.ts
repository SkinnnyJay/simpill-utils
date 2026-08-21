/**
 * Barrel parity: every VALUE exported from ./shared must also be reachable
 * from the root barrel. parseEnvEnum/parseEnvEnumStrict were exported from
 * "@simpill/env.utils/shared" but silently missing from the root — the same
 * defect class as LogPayload (adapters) and the /client barrel gap (misc).
 */

import * as clientBarrel from "../src/client";
import * as rootBarrel from "../src/index";
import * as sharedBarrel from "../src/shared";

describe("barrel parity", () => {
  it("root re-exports every runtime value from shared", () => {
    const missing = Object.keys(sharedBarrel).filter((name) => !(name in rootBarrel));
    expect(missing).toEqual([]);
  });

  it("previously missing enum parsers are importable from the root", () => {
    expect(typeof rootBarrel.parseEnvEnum).toBe("function");
    expect(typeof rootBarrel.parseEnvEnumStrict).toBe("function");
  });

  it("createEnv is exported from root AND client (it is Edge-safe)", () => {
    expect(typeof rootBarrel.createEnv).toBe("function");
    expect(typeof clientBarrel.createEnv).toBe("function");
    expect(clientBarrel.createEnv).toBe(rootBarrel.createEnv);
  });

  it("client exposes the Edge-safe parse helpers and redaction", () => {
    expect(typeof clientBarrel.parseNumberEnvValue).toBe("function");
    expect(typeof clientBarrel.parseEnvEnum).toBe("function");
    expect(typeof clientBarrel.redactEnvValue).toBe("function");
    expect(clientBarrel.REDACTED_VALUE).toBe("[redacted]");
  });
});
