import {
  type ConfigLayer,
  configFromEnv,
  mergeConfigLayers,
  requireKeys,
} from "../../../src/shared/config.utils";
import { deepDefaults } from "../../../src/shared/data.extend";

describe("deepDefaults uplift", () => {
  it("blocks __proto__ injection (frozen ref injected inherited props via JSON-parsed defaults)", () => {
    const evil = JSON.parse('{"__proto__": {"isAdmin": true}}') as Partial<Record<string, unknown>>;
    const out = deepDefaults({}, evil) as { isAdmin?: boolean };
    expect(out.isAdmin).toBeUndefined();
    expect(({} as { isAdmin?: boolean }).isAdmin).toBeUndefined();
  });

  it("blocks constructor/prototype segments at every depth", () => {
    const evil = JSON.parse('{"a": {"constructor": {"prototype": {"pwned": true}}}}') as Partial<
      Record<string, unknown>
    >;
    const out = deepDefaults({ a: {} } as Record<string, unknown>, evil) as {
      a: Record<string, unknown>;
    };
    expect(out.a.constructor).toBe(Object);
    expect(({} as { pwned?: boolean }).pwned).toBeUndefined();
  });

  it("deep-clones defaults-only branches (frozen ref aliased them by reference)", () => {
    const defaults = { nested: { x: 1 }, list: [1, 2] };
    const out = deepDefaults({} as Partial<typeof defaults>, defaults) as typeof defaults;
    out.nested.x = 999;
    out.list.push(3);
    expect(defaults.nested.x).toBe(1);
    expect(defaults.list).toEqual([1, 2]);
  });

  it("original semantics preserved: target wins, nested plain objects merge", () => {
    const target: Partial<{ a: number; b: number }> = { a: 1 };
    expect(deepDefaults(target, { a: 10, b: 2 })).toEqual({ a: 1, b: 2 });
    const nestedTarget = { a: { x: 1 } };
    expect(
      deepDefaults(nestedTarget, { a: { y: 2 } } as unknown as Partial<typeof nestedTarget>),
    ).toEqual({ a: { x: 1, y: 2 } });
  });
});

describe("mergeConfigLayers uplift", () => {
  it("blocks the deep-merge prototype-pollution class from JSON-parsed layers", () => {
    const out = mergeConfigLayers([{}, JSON.parse('{"__proto__": {"pwned": true}}')]) as {
      pwned?: boolean;
    };
    expect(out.pwned).toBeUndefined();
    expect(({} as { pwned?: boolean }).pwned).toBeUndefined();
  });

  it("no longer aliases layer objects into the merged output", () => {
    const layer: ConfigLayer = { db: { host: "a" }, list: [1] };
    const merged = mergeConfigLayers([{}, layer]) as { db: { host: string }; list: number[] };
    merged.db.host = "mutated";
    merged.list.push(2);
    expect((layer.db as { host: string }).host).toBe("a");
    expect(layer.list).toEqual([1]);
  });

  it("original semantics preserved: right wins, deep merge of plain objects", () => {
    expect(mergeConfigLayers([{ a: 1 }, { b: 2 }, { a: 3 }])).toEqual({ a: 3, b: 2 });
    expect(mergeConfigLayers([{ db: { host: "x", port: 1 } }, { db: { port: 2 } }])).toEqual({
      db: { host: "x", port: 2 },
    });
  });
});

describe("requireKeys uplift", () => {
  it("supports dotted paths into nested config (frozen ref threw despite the key being present)", () => {
    const config = { db: { host: "x" } };
    expect(() => requireKeys(config, ["db.host"])).not.toThrow();
    expect(() => requireKeys(config, ["db.port"])).toThrow("required key");
  });

  it("literal top-level keys containing dots still pass first", () => {
    expect(() => requireKeys({ "weird.key": 1 }, ["weird.key"])).not.toThrow();
  });

  it("original behavior preserved: top-level presence, undefined counts as missing", () => {
    expect(() => requireKeys({ a: 1 }, ["a"])).not.toThrow();
    expect(() => requireKeys({ a: undefined }, ["a"])).toThrow("required key");
    expect(() => requireKeys({ a: 1 }, ["b"])).toThrow("required key");
  });
});

describe("configFromEnv uplift", () => {
  it('default mode unchanged: every "_" nests (backward compatible)', () => {
    expect(configFromEnv({ APP_DB_HOST: "h" }, "APP")).toEqual({ db: { host: "h" } });
  });

  it('nestingSeparator "__" keeps single underscores in keys (.NET/nconf convention)', () => {
    const env = { APP_API_KEY: "secret", APP_DB__HOST: "h", APP_DB__POOL_SIZE: "5" };
    expect(configFromEnv(env, "APP", { nestingSeparator: "__" })).toEqual({
      api_key: "secret",
      db: { host: "h", pool_size: "5" },
    });
  });

  it('keyCase "preserve" keeps original casing', () => {
    expect(
      configFromEnv({ APP_DB__HOST: "h" }, "APP", { nestingSeparator: "__", keyCase: "preserve" }),
    ).toEqual({ DB: { HOST: "h" } });
  });

  it("skips hostile prototype-key env names instead of creating them", () => {
    const env = { APP___PROTO___X: "evil", APP_OK: "1" };
    const out = configFromEnv(env, "APP") as { ok?: string };
    expect(out).toEqual({ ok: "1" });
    expect(({} as { x?: string }).x).toBeUndefined();
  });

  it("ignores undefined values and non-prefixed keys (original behavior)", () => {
    expect(configFromEnv({ APP_A: undefined, OTHER_B: "x", APP_C: "1" }, "APP")).toEqual({
      c: "1",
    });
  });
});
