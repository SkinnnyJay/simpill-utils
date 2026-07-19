import { parseRetryAfterMs } from "../../../src/shared/retry-after";

describe("parseRetryAfterMs", () => {
  it("parses delta-seconds into milliseconds", () => {
    expect(parseRetryAfterMs("120")).toBe(120000);
    expect(parseRetryAfterMs("0")).toBe(0);
    expect(parseRetryAfterMs(" 5 ")).toBe(5000);
  });

  it("parses an HTTP-date relative to now", () => {
    const now = Date.parse("Wed, 21 Oct 2026 07:28:00 GMT");
    expect(parseRetryAfterMs("Wed, 21 Oct 2026 07:28:30 GMT", now)).toBe(30000);
  });

  it("clamps past HTTP-dates to zero", () => {
    const now = Date.parse("Wed, 21 Oct 2026 07:28:00 GMT");
    expect(parseRetryAfterMs("Wed, 21 Oct 2026 07:27:00 GMT", now)).toBe(0);
  });

  it("returns undefined for absent or unparseable values", () => {
    expect(parseRetryAfterMs(null)).toBeUndefined();
    expect(parseRetryAfterMs(undefined)).toBeUndefined();
    expect(parseRetryAfterMs("")).toBeUndefined();
    expect(parseRetryAfterMs("soon")).toBeUndefined();
    expect(parseRetryAfterMs("-5")).toBeUndefined();
  });
});
