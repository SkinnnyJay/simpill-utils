import {
  clearAnnotations,
  createAnnotationStore,
  deleteAnnotation,
  getAnnotation,
  getAnnotationKeys,
  getAnnotations,
  getInheritedAnnotation,
  hasAnnotation,
  hasInheritedAnnotation,
  setAnnotation,
} from "../../../src/shared/annotations";
import { createMetadataKey } from "../../../src/shared/metadata-store";

describe("per-target annotations", () => {
  it("set/get/has/delete are keyed by (target, key)", () => {
    const a = {};
    const b = {};
    setAnnotation(a, "role", "admin");
    expect(getAnnotation<string>(a, "role")).toBe("admin");
    expect(getAnnotation(b, "role")).toBeUndefined();
    expect(hasAnnotation(a, "role")).toBe(true);
    expect(hasAnnotation(b, "role")).toBe(false);
    expect(deleteAnnotation(a, "role")).toBe(true);
    expect(deleteAnnotation(a, "role")).toBe(false);
    expect(getAnnotation(a, "role")).toBeUndefined();
  });

  it("supports symbol and typed keys on targets", () => {
    const target = class Service {};
    const sym = Symbol("route");
    const typed = createMetadataKey<number>("weight");
    setAnnotation(target, sym, "/users");
    setAnnotation(target, typed, 10);
    expect(getAnnotation<string>(target, sym)).toBe("/users");
    const weight = getAnnotation(target, typed); // inferred number | undefined
    expect(weight).toBe(10);
    clearAnnotations(target);
  });

  it("getAnnotation is own-only; getInheritedAnnotation walks the prototype chain", () => {
    class Base {}
    class Child extends Base {}
    setAnnotation(Base, "serializable", true);
    // Own read on Child: nothing.
    expect(getAnnotation(Child, "serializable")).toBeUndefined();
    expect(hasAnnotation(Child, "serializable")).toBe(false);
    // Inherited read on Child: finds Base's annotation (class statics chain).
    expect(getInheritedAnnotation<boolean>(Child, "serializable")).toBe(true);
    expect(hasInheritedAnnotation(Child, "serializable")).toBe(true);
    // Child's own annotation shadows Base's.
    setAnnotation(Child, "serializable", false);
    expect(getInheritedAnnotation<boolean>(Child, "serializable")).toBe(false);
    clearAnnotations(Base);
    clearAnnotations(Child);
  });

  it("inherited lookup works on instances through their prototype", () => {
    class Widget {}
    setAnnotation(Widget.prototype, "kind", "widget");
    const instance = new Widget();
    expect(getAnnotation(instance, "kind")).toBeUndefined();
    expect(getInheritedAnnotation<string>(instance, "kind")).toBe("widget");
    clearAnnotations(Widget.prototype);
  });

  it("inherited lookup returns undefined when no prototype has the key", () => {
    const obj = Object.create(null) as object;
    expect(getInheritedAnnotation(obj, "missing")).toBeUndefined();
    expect(hasInheritedAnnotation({}, "missing")).toBe(false);
  });

  it("annotations can store undefined values distinctly from absence", () => {
    const t = {};
    setAnnotation(t, "u", undefined);
    expect(hasAnnotation(t, "u")).toBe(true);
    expect(getAnnotationKeys(t)).toEqual(["u"]);
    expect(deleteAnnotation(t, "u")).toBe(true);
  });

  it("getAnnotationKeys and getAnnotations expose own entries incl. symbols", () => {
    const t = {};
    const sym = Symbol("s");
    setAnnotation(t, "a", 1);
    setAnnotation(t, sym, 2);
    expect(getAnnotationKeys(t)).toEqual(["a", sym]);
    const record = getAnnotations(t);
    expect(record.a).toBe(1);
    expect(record[sym]).toBe(2);
    clearAnnotations(t);
    expect(getAnnotationKeys(t)).toEqual([]);
    expect(getAnnotations(t)).toEqual({});
  });

  it("clearAnnotations reports whether anything existed", () => {
    const t = {};
    expect(clearAnnotations(t)).toBe(false);
    setAnnotation(t, "x", 1);
    expect(clearAnnotations(t)).toBe(true);
    expect(clearAnnotations(t)).toBe(false);
  });

  it("reads and deletes on never-annotated targets do not create state", () => {
    const t = {};
    expect(getAnnotation(t, "k")).toBeUndefined();
    expect(hasAnnotation(t, "k")).toBe(false);
    expect(deleteAnnotation(t, "k")).toBe(false);
    expect(getAnnotationKeys(t)).toEqual([]);
    // deleting the last annotation releases per-target state entirely
    setAnnotation(t, "k", 1);
    deleteAnnotation(t, "k");
    expect(clearAnnotations(t)).toBe(false); // map was released, nothing to clear
  });

  it("createAnnotationStore isolates state from the default store", () => {
    const scoped = createAnnotationStore();
    const t = {};
    scoped.setAnnotation(t, "k", "scoped");
    expect(scoped.getAnnotation<string>(t, "k")).toBe("scoped");
    expect(getAnnotation(t, "k")).toBeUndefined(); // default store untouched
    setAnnotation(t, "k", "default");
    expect(scoped.getAnnotation<string>(t, "k")).toBe("scoped"); // and vice versa
    deleteAnnotation(t, "k");
  });

  it("default annotation backing is shared across isolated module copies", () => {
    let first: typeof import("../../../src/shared/annotations") | undefined;
    let second: typeof import("../../../src/shared/annotations") | undefined;
    jest.isolateModules(() => {
      first = require("../../../src/shared/annotations");
    });
    jest.isolateModules(() => {
      second = require("../../../src/shared/annotations");
    });
    if (first === undefined || second === undefined) {
      throw new Error("isolateModules did not load module copies");
    }
    const target = {};
    first.setAnnotation(target, "shared", 42);
    expect(second.getAnnotation<number>(target, "shared")).toBe(42);
    expect(second.deleteAnnotation(target, "shared")).toBe(true);
    expect(first.hasAnnotation(target, "shared")).toBe(false);
  });
});
