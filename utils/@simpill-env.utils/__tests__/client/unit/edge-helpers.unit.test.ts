import { hasEdgeEnv, isEdgeDev, isEdgeProd } from "../../../src/client/env.edge";

describe("hasEdgeEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return true when variable exists", () => {
    process.env.TEST = "value";
    expect(hasEdgeEnv("TEST")).toBe(true);
  });

  it("should return false when variable does not exist", () => {
    delete process.env.TEST;
    expect(hasEdgeEnv("TEST")).toBe(false);
  });
});

describe("isEdgeProd", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return true when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";
    expect(isEdgeProd()).toBe(true);
  });

  it("should return false when NODE_ENV is not production", () => {
    process.env.NODE_ENV = "development";
    expect(isEdgeProd()).toBe(false);
  });
});

describe("isEdgeDev", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return true when NODE_ENV is development", () => {
    process.env.NODE_ENV = "development";
    expect(isEdgeDev()).toBe(true);
  });

  it("should return false when NODE_ENV is not development", () => {
    process.env.NODE_ENV = "production";
    expect(isEdgeDev()).toBe(false);
  });
});
