import { delay } from "../../../src/shared/delay";

describe("delay", () => {
  it("resolves after ms", async () => {
    const start = Date.now();
    await delay(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(18);
  });
});
