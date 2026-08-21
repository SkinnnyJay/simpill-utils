/**
 * @file Regression tests for bugs fixed in the Lumen Industries patterns uplift:
 * state-machine falsy-state transitions, flyweight falsy-value cache bypass,
 * observer/mediator delivery isolation.
 */

import { createFlyweightFactory } from "../../../src/shared/flyweight";
import { createMediator } from "../../../src/shared/mediator";
import { createObservable } from "../../../src/shared/observer";
import { createStateMachine } from "../../../src/shared/state-machine";

describe("state-machine falsy state (uplift fix)", () => {
  it("transitions into an empty-string state instead of throwing", () => {
    type S = "" | "named";
    type E = "toEmpty" | "toNamed";
    const m = createStateMachine<S, E>("named", {
      named: { toEmpty: "" },
      "": { toNamed: "named" },
    });
    expect(m.transition("toEmpty")).toBe("");
    expect(m.getState()).toBe("");
    expect(m.transition("toNamed")).toBe("named");
  });

  it("still throws for genuinely missing transitions", () => {
    const m = createStateMachine<"a" | "b", "go">("a", { a: { go: "b" } });
    m.transition("go");
    expect(() => m.transition("go")).toThrow(/No transition/);
  });
});

describe("flyweight falsy values (uplift fix)", () => {
  it("caches falsy instances instead of re-creating them every get", () => {
    let created = 0;
    const f = createFlyweightFactory<string, number>(
      (k) => k,
      () => {
        created++;
        return 0; // falsy instance
      }
    );
    f.get("zero");
    f.get("zero");
    f.get("zero");
    expect(created).toBe(1); // previously 3 — cache was bypassed for falsy values
    expect(f.size()).toBe(1);
  });

  it("same key still returns the identical (truthy) instance", () => {
    const f = createFlyweightFactory<string, { id: string }>(
      (k) => k,
      (k) => ({ id: k })
    );
    expect(f.get("a")).toBe(f.get("a"));
  });
});

describe("observer delivery isolation (uplift fix)", () => {
  it("a throwing observer no longer blocks delivery to the rest", () => {
    const o = createObservable<number>();
    const seen: number[] = [];
    o.subscribe(() => {
      throw new Error("observer boom");
    });
    o.subscribe((n) => {
      seen.push(n);
    });
    expect(() => o.next(42)).toThrow("observer boom"); // still loud
    expect(seen).toEqual([42]); // but delivery completed
  });
});

describe("mediator delivery isolation (uplift fix)", () => {
  it("a throwing handler no longer blocks delivery to the rest", () => {
    const m = createMediator<{ ping: number }>();
    const seen: number[] = [];
    m.on("ping", () => {
      throw new Error("handler boom");
    });
    m.on("ping", (n) => {
      seen.push(n);
    });
    expect(() => m.emit("ping", 7)).toThrow("handler boom");
    expect(seen).toEqual([7]);
  });
});
