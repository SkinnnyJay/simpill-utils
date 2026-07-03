/**
 * Pins the FakerWrapper cross-instance seed-bleed regression against the
 * REAL @faker-js/faker.
 *
 * Why child-node instead of importing in jest: @faker-js/faker v10 is
 * ESM-only and cannot be loaded by Jest's CJS resolver (faker-js/faker
 * #3606) — which is why the mocked unit suite could never see this bug.
 * Real Node >= 20.19 loads it fine via require(esm), so we compile the
 * package and exercise dist/ in a real node process, the same way a
 * consumer would.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";

const pkgRoot = path.resolve(__dirname, "../../..");

function runNode(script: string): string {
  return execFileSync(process.execPath, ["-e", script], {
    cwd: pkgRoot,
    encoding: "utf8",
  }).trim();
}

beforeAll(() => {
  if (!existsSync(path.join(pkgRoot, "dist/shared/faker-wrapper.js"))) {
    execFileSync("npx", ["tsc"], { cwd: pkgRoot, stdio: "ignore" });
  }
}, 120000);

describe("FakerWrapper instance isolation (real @faker-js/faker via dist)", () => {
  // REGRESSION: the wrapper preferred the module's GLOBAL faker singleton and
  // called faker.seed(seed) on it — constructing wrapper B re-seeded wrapper
  // A's stream, so A's draws came from B's seed (verified on faker 10.3.0).
  it("constructing a second wrapper does not re-seed the first", () => {
    const out = runNode(`
      const { createFaker } = require("./dist/shared/faker-wrapper.js");
      const solo = createFaker({ seed: 1 });
      const expected = solo.string(5);
      const a = createFaker({ seed: 1 });
      const b = createFaker({ seed: 2 });
      const aDraw = a.string(5);
      const bDraw = b.string(5);
      console.log(JSON.stringify({ isolated: aDraw === expected, distinct: bDraw !== expected }));
    `);
    expect(JSON.parse(out)).toEqual({ isolated: true, distinct: true });
  });

  it("same seed reproduces the same sequence; interleaved wrappers stay independent", () => {
    const out = runNode(`
      const { createFaker } = require("./dist/shared/faker-wrapper.js");
      const r1 = createFaker({ seed: 11 });
      const seq1 = [r1.string(4), r1.string(4)];
      const r2 = createFaker({ seed: 22 });
      const seq2 = [r2.string(4), r2.string(4)];
      const a = createFaker({ seed: 11 });
      const b = createFaker({ seed: 22 });
      const interleaved = [a.string(4), b.string(4), a.string(4), b.string(4)];
      const same = JSON.stringify(interleaved) === JSON.stringify([seq1[0], seq2[0], seq1[1], seq2[1]]);
      const c = createFaker({ seed: 7 });
      const d = createFaker({ seed: 7 });
      console.log(JSON.stringify({ independent: same, reproducible: c.uuid() === d.uuid() }));
    `);
    expect(JSON.parse(out)).toEqual({ independent: true, reproducible: true });
  });

  it("unseeded wrappers default to DEFAULT_SEED (reproducible by default)", () => {
    const out = runNode(`
      const { createFaker } = require("./dist/shared/faker-wrapper.js");
      const { DEFAULT_SEED } = require("./dist/shared/constants.js");
      const a = createFaker();
      const b = createFaker({ seed: DEFAULT_SEED });
      console.log(a.string(6) === b.string(6));
    `);
    expect(out).toBe("true");
  });

  it("pick/date behave on the real instance", () => {
    const out = runNode(`
      const { createFaker } = require("./dist/shared/faker-wrapper.js");
      const f = createFaker({ seed: 3 });
      let threw = false;
      try { f.pick([]); } catch { threw = true; }
      const from = new Date(2020, 0, 1), to = new Date(2021, 0, 1);
      const d = f.date(from, to);
      console.log(JSON.stringify({
        threw,
        member: ["x", "y"].includes(f.pick(["x", "y"])),
        inRange: d >= from && d <= to,
      }));
    `);
    expect(JSON.parse(out)).toEqual({ threw: true, member: true, inRange: true });
  });
});
