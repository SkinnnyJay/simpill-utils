import { createStateMachine } from "../../../src/shared/state-machine";

describe("createStateMachine", () => {
  it("transitions through states based on events", () => {
    type State = "idle" | "loading" | "success" | "error";
    type Event = "FETCH" | "RESOLVE" | "REJECT" | "RESET";

    const machine = createStateMachine<State, Event>("idle", {
      idle: { FETCH: "loading" },
      loading: {
        RESOLVE: "success",
        REJECT: "error",
      },
      success: { RESET: "idle" },
      error: { RESET: "idle" },
    });

    expect(machine.getState()).toBe("idle");
    expect(machine.can("FETCH")).toBe(true);
    expect(machine.can("RESOLVE")).toBe(false);

    machine.transition("FETCH");
    expect(machine.getState()).toBe("loading");

    machine.transition("RESOLVE");
    expect(machine.getState()).toBe("success");
  });

  it("supports functional transitions and hooks", () => {
    type State = "a" | "b";
    type Event = "NEXT";
    const seen: Array<string> = [];

    const machine = createStateMachine<State, Event, number>(
      "a",
      {
        a: {
          NEXT: (value) => (value && value > 0 ? "b" : "a"),
        },
      },
      {
        onTransition: (next, prev) => {
          seen.push(`${prev}->${next}`);
        },
      }
    );

    machine.transition("NEXT", 1);
    expect(machine.getState()).toBe("b");
    expect(seen).toEqual(["a->b"]);
  });

  it("throws on unknown transitions by default", () => {
    type State = "idle" | "busy";
    type Event = "START";

    const machine = createStateMachine<State, Event>("idle", {
      idle: {},
    });

    expect(() => machine.transition("START")).toThrow("No transition for event: START");
  });

  it("allows unknown transitions when configured", () => {
    type State = "idle" | "busy";
    type Event = "START";

    const machine = createStateMachine<State, Event>("idle", { idle: {} }, { allowUnknown: true });

    expect(machine.transition("START")).toBe("idle");
  });
});
