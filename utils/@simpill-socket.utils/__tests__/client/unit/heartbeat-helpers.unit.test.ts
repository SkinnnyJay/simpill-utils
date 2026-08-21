import { defaultIsPong } from "../../../src/client/heartbeat-helpers";

/**
 * MessageEvent.data from a real WebSocket is always a string, Blob or ArrayBuffer - never a
 * parsed object. The object branch was therefore unreachable in production, so a server using
 * the `{ type: "pong" }` convention this package documents had every pong missed, and the
 * heartbeat closed a perfectly healthy socket after maxMisses intervals.
 */
describe("defaultIsPong", () => {
  it("accepts the bare string form", () => {
    expect(defaultIsPong("pong")).toBe(true);
  });

  it("accepts a JSON pong delivered as a string, as a real socket delivers it", () => {
    expect(defaultIsPong(JSON.stringify({ type: "pong" }))).toBe(true);
    expect(defaultIsPong(' {"type":"pong"}')).toBe(true);
    expect(defaultIsPong('{"type":"pong","ts":123}')).toBe(true);
  });

  it("still accepts an already-parsed object", () => {
    expect(defaultIsPong({ type: "pong" })).toBe(true);
  });

  it("rejects anything that is not a pong", () => {
    expect(defaultIsPong(JSON.stringify({ type: "data" }))).toBe(false);
    expect(defaultIsPong("{not json")).toBe(false);
    expect(defaultIsPong("hello")).toBe(false);
    expect(defaultIsPong(null)).toBe(false);
    expect(defaultIsPong(undefined)).toBe(false);
    expect(defaultIsPong(42)).toBe(false);
  });
});
