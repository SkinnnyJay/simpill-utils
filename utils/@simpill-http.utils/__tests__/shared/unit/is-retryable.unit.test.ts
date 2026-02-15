import { isRetryableStatus } from "../../../src/shared/is-retryable";

describe("isRetryableStatus", () => {
  it("returns true for 408", () => {
    expect(isRetryableStatus(408)).toBe(true);
  });

  it("returns true for 429", () => {
    expect(isRetryableStatus(429)).toBe(true);
  });

  it("returns true for 5xx", () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(599)).toBe(true);
  });

  it("returns false for 4xx except 408 and 429", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it("returns false for 2xx and 3xx", () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(201)).toBe(false);
    expect(isRetryableStatus(302)).toBe(false);
  });
});
