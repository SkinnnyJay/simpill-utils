import { raceOk } from "../../../src/shared/race-ok";
import { err, ok } from "../../../src/shared/result";

describe("raceOk", () => {
  it("resolves with first ok result", async () => {
    const results = [
      Promise.resolve(err("nope")),
      Promise.resolve(ok("yes")),
      Promise.resolve(ok("later")),
    ];
    const resolved = await raceOk(results);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.value).toBe("yes");
  });

  it("returns err when all fail", async () => {
    const resolved = await raceOk([Promise.resolve(err("no"))]);
    expect(resolved.ok).toBe(false);
  });
});
