import { setupObservability } from "../../../src/server/setup-observability";

describe("setupObservability", () => {
  it("should not throw when called with default options", () => {
    expect(() => setupObservability()).not.toThrow();
  });

  it("should not throw when setLogContextProvider is true", () => {
    expect(() => setupObservability({ setLogContextProvider: true })).not.toThrow();
  });

  it("should not throw when setLogContextProvider is false", () => {
    expect(() => setupObservability({ setLogContextProvider: false })).not.toThrow();
  });
});
