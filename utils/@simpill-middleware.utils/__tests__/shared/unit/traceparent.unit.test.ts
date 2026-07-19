import { parseTraceparent } from "../../../src/shared/traceparent";

describe("parseTraceparent", () => {
  it("parses a valid version-00 header", () => {
    const tp = parseTraceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
    expect(tp).toEqual({
      version: "00",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      parentId: "00f067aa0ba902b7",
      traceFlags: "01",
      sampled: true,
    });
  });

  it("reports sampled=false for flags 00", () => {
    expect(
      parseTraceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00")?.sampled,
    ).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    expect(
      parseTraceparent("  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01  ")?.traceId,
    ).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it.each([
    ["undefined input", undefined],
    ["empty string", ""],
    ["garbage", "hello"],
    ["missing dashes", "004bf92f3577b34da6a3ce929d0e0e473600f067aa0ba902b701"],
    ["uppercase hex", "00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01"],
    ["short trace-id", "00-4bf92f3577b34da6a3ce929d0e0e47-00f067aa0ba902b7-01"],
    ["non-hex char", "00-4bf92f3577b34da6a3ce929d0g0e4736-00f067aa0ba902b7-01"],
    ["forbidden version ff", "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"],
    ["all-zero trace-id", "00-00000000000000000000000000000000-00f067aa0ba902b7-01"],
    ["all-zero parent-id", "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01"],
  ])("returns undefined for %s", (_label, value) => {
    expect(parseTraceparent(value as string | undefined)).toBeUndefined();
  });
});
