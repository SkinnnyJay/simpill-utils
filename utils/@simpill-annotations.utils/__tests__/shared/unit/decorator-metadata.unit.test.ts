import {
  ensureSymbolMetadata,
  getDecoratorMetadata,
  metadataStoreFromDecorator,
  readDecoratorMetadata,
  symbolMetadata,
} from "../../../src/shared/decorator-metadata";
import { createMetadataKey } from "../../../src/shared/metadata-store";

/**
 * Simulates the TC39 decorator protocol without decorator syntax (keeps the
 * package's ES2020 tsconfig untouched): a "transpiler" that creates the
 * context.metadata object, runs decorator functions against it, and defines
 * it on the class under Symbol.metadata — including the spec's inheritance
 * rule (subclass metadata objects prototype-link to the parent's).
 */
function applyClassDecorators<T extends abstract new (...args: never[]) => unknown>(
  cls: T,
  decorators: Array<(value: T, context: { metadata: Record<PropertyKey, unknown> }) => void>,
  parent?: T
): T {
  const parentMetadata = parent === undefined ? null : (getDecoratorMetadata(parent) ?? null);
  const metadata: Record<PropertyKey, unknown> = Object.create(parentMetadata) as Record<
    PropertyKey,
    unknown
  >;
  for (const decorator of decorators) {
    decorator(cls, { metadata });
  }
  Object.defineProperty(cls, symbolMetadata(), { value: metadata, configurable: true });
  return cls;
}

describe("symbolMetadata / ensureSymbolMetadata", () => {
  it("symbolMetadata resolves native Symbol.metadata or the registry fallback", () => {
    const s = symbolMetadata();
    expect(typeof s).toBe("symbol");
    const native = (Symbol as { metadata?: symbol }).metadata;
    if (native !== undefined) {
      expect(s).toBe(native);
    } else {
      expect(s).toBe(Symbol.for("Symbol.metadata"));
    }
  });

  it("ensureSymbolMetadata installs the registry symbol and is idempotent", () => {
    const installed = ensureSymbolMetadata();
    expect((Symbol as { metadata?: symbol }).metadata).toBe(installed);
    expect(ensureSymbolMetadata()).toBe(installed);
    expect(symbolMetadata()).toBe(installed);
  });
});

describe("getDecoratorMetadata / readDecoratorMetadata", () => {
  it("returns undefined for undecorated classes", () => {
    class Plain {}
    expect(getDecoratorMetadata(Plain)).toBeUndefined();
    expect(readDecoratorMetadata(Plain, "anything")).toBeUndefined();
  });

  it("reads metadata written by a standard decorator via context.metadata", () => {
    class UserController {}
    const route =
      (path: string) => (_v: unknown, context: { metadata: Record<PropertyKey, unknown> }) => {
        context.metadata.route = path;
      };
    applyClassDecorators(UserController, [route("/users")]);
    expect(readDecoratorMetadata<string>(UserController, "route")).toBe("/users");
    expect(getDecoratorMetadata(UserController)).toMatchObject({ route: "/users" });
  });

  it("inherits metadata from decorated base classes per the proposal", () => {
    class Base {}
    class Child extends Base {}
    applyClassDecorators(Base, [
      (_v, ctx) => {
        ctx.metadata.layer = "base";
        ctx.metadata.shared = "from-base";
      },
    ]);
    applyClassDecorators(Child, [(_v, ctx) => (ctx.metadata.layer = "child")], Base);
    // Child's own key shadows; un-shadowed keys inherit via the metadata
    // object's prototype chain.
    expect(readDecoratorMetadata<string>(Child, "layer")).toBe("child");
    expect(readDecoratorMetadata<string>(Child, "shared")).toBe("from-base");
    expect(readDecoratorMetadata<string>(Base, "layer")).toBe("base");
  });

  it("supports typed keys for decorator metadata reads", () => {
    const weight = createMetadataKey<number>("weight");
    class Task {}
    applyClassDecorators(Task, [
      (_v, ctx) => {
        ctx.metadata[weight as unknown as symbol] = 3;
      },
    ]);
    const value = readDecoratorMetadata(Task, weight); // inferred number | undefined
    expect(value).toBe(3);
  });
});

describe("metadataStoreFromDecorator", () => {
  it("bridges context.metadata to the MetadataStore API inside a decorator", () => {
    class Api {}
    const tag =
      (name: string) => (_v: unknown, context: { metadata: Record<PropertyKey, unknown> }) => {
        const store = metadataStoreFromDecorator(context.metadata);
        store.getOrSet<string[]>("tags", () => []).push(name);
      };
    applyClassDecorators(Api, [tag("v1"), tag("public")]);
    expect(readDecoratorMetadata<string[]>(Api, "tags")).toEqual(["v1", "public"]);
  });

  it("get/has see inherited entries; set/delete/size/iteration are own-only", () => {
    const parentMetadata: Record<PropertyKey, unknown> = { inherited: "p" };
    const childMetadata = Object.create(parentMetadata) as Record<PropertyKey, unknown>;
    childMetadata.own = "c";
    const store = metadataStoreFromDecorator(childMetadata);
    // inherited reads
    expect(store.get<string>("inherited")).toBe("p");
    expect(store.has("inherited")).toBe(true);
    // own-only enumeration
    expect(store.size).toBe(1);
    expect(Array.from(store.keys())).toEqual(["own"]);
    expect(Array.from(store.entries())).toEqual([["own", "c"]]);
    expect(Array.from(store)).toEqual([["own", "c"]]);
    // delete is own-only: inherited entry survives, returns false
    expect(store.delete("inherited")).toBe(false);
    expect(store.get("inherited")).toBe("p");
    expect(store.delete("own")).toBe(true);
    expect(store.size).toBe(0);
    // clear removes own keys only
    childMetadata.a = 1;
    childMetadata.b = 2;
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get("inherited")).toBe("p");
    // set writes an own entry that shadows
    store.set("inherited", "shadowed");
    expect(store.get<string>("inherited")).toBe("shadowed");
    expect(parentMetadata.inherited).toBe("p");
  });

  it("supports symbol keys and values() over the metadata object", () => {
    const metadata: Record<PropertyKey, unknown> = {};
    const store = metadataStoreFromDecorator(metadata);
    const sym = Symbol("s");
    store.set(sym, 1);
    store.set("k", 2);
    expect(Array.from(store.values()).sort()).toEqual([1, 2]);
    expect(store.get<number>(sym)).toBe(1);
  });
});
