import * as clientBarrel from "../../../src/client";
import * as rootBarrel from "../../../src/index";
import * as serverBarrel from "../../../src/server";
import * as sharedBarrel from "../../../src/shared";
import { ensureKeys, omitKeys, pickKeys } from "../../../src/shared/data.utils";

describe("pickKeys / omitKeys / ensureKeys uplift", () => {
  it("pickKeys no longer picks inherited properties (frozen used `in`, walking the prototype chain)", () => {
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as { inherited: number; own?: number };
    obj.own = 2;
    expect(pickKeys(obj, ["inherited", "own"])).toEqual({ own: 2 });
  });

  it("pickKeys original behavior preserved for own keys", () => {
    expect(pickKeys({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("an own __proto__ key never replaces the result prototype (pick/omit/ensure)", () => {
    const evil = JSON.parse('{"__proto__": {"isAdmin": true}, "ok": 1}') as Record<string, unknown>;
    const picked = pickKeys(evil, ["__proto__" as keyof typeof evil]);
    expect(Object.getPrototypeOf(picked)).toBe(Object.prototype);
    expect((picked as { isAdmin?: boolean }).isAdmin).toBeUndefined();

    const omitted = omitKeys(evil, ["ok" as keyof typeof evil]);
    expect(Object.getPrototypeOf(omitted)).toBe(Object.prototype);
    expect((omitted as { isAdmin?: boolean }).isAdmin).toBeUndefined();
  });

  it("ensureKeys original behavior preserved", () => {
    const out = ensureKeys({ a: 1 } as { a: number; b?: number }, ["a", "b"]);
    expect("b" in out).toBe(true);
    expect(out.b).toBeUndefined();
  });
});

describe("barrel parity", () => {
  it("client and server export the full shared surface (frozen barrels omitted the entire search module)", () => {
    const sharedKeys = Object.keys(sharedBarrel).sort();
    expect(Object.keys(clientBarrel).sort()).toEqual(sharedKeys);
    expect(Object.keys(serverBarrel).sort()).toEqual(sharedKeys);
    for (const k of sharedKeys) {
      expect(Object.keys(rootBarrel)).toContain(k);
    }
  });

  it("search module reachable from client/server (regression pin)", () => {
    expect(typeof clientBarrel.searchObject).toBe("function");
    expect(typeof clientBarrel.searchString).toBe("function");
    expect(typeof serverBarrel.searchStringAll).toBe("function");
    expect(clientBarrel.StringSearchAlgorithm.Kmp).toBe("kmp");
  });

  it("new API reachable from every entry point", () => {
    for (const barrel of [rootBarrel, clientBarrel, serverBarrel, sharedBarrel]) {
      expect(typeof barrel.validateArray).toBe("function");
      expect(typeof barrel.validateEnum).toBe("function");
      expect(typeof barrel.validateBoolean).toBe("function");
      expect(typeof barrel.refine).toBe("function");
      expect(typeof barrel.mapResult).toBe("function");
      expect(typeof barrel.andThenResult).toBe("function");
      expect(typeof barrel.searchStringAll).toBe("function");
    }
  });
});
