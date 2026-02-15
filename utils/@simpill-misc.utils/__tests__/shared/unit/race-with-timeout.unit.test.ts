describe("raceWithTimeout", () => {
  it("returns result when promise resolves first", async () => {
    const { raceWithTimeout } = require("../../../src/shared");
    const result = await raceWithTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it("throws when timeout wins", async () => {
    const { raceWithTimeout } = require("../../../src/shared");
    const never = new Promise<number>(() => {});
    await expect(raceWithTimeout(never, 10)).rejects.toThrow(/timed out/);
  });
});
