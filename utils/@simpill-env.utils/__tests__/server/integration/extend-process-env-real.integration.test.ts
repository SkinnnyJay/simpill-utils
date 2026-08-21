/**
 * PROOF-GRADE tests for extendProcessEnvPrototype against the REAL
 * process.env in a REAL child Node process.
 *
 * The v1 implementation (`Object.assign(process.env, { fns })`) passed its
 * unit tests only because they replaced process.env with a plain object
 * (`process.env = { ...originalEnv }`). Real Node's process.env setter
 * coerces every assigned value to a STRING, so the helpers were stored as
 * source text and calling them threw. These tests spawn real `node`
 * (no jest environment doctoring) to prove both the bug and the fix.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as path from "node:path";
import { EnvManager } from "../../../src/server/env-manager";

const PACKAGE_ROOT = path.resolve(__dirname, "../../..");
const DIST_ENTRY = path.join(PACKAGE_ROOT, "dist", "server", "env-manager.js");

function runNode(script: string): { status: number; stdout: string } {
  try {
    const stdout = execFileSync(process.execPath, ["-e", script], {
      encoding: "utf8",
      timeout: 30_000,
    });
    return { status: 0, stdout };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string };
    return { status: failure.status ?? -1, stdout: failure.stdout ?? "" };
  }
}

describe("extendProcessEnvPrototype on the REAL process.env", () => {
  beforeAll(() => {
    // Always rebuild: a stale dist (e.g. from a previous checkout) would
    // silently test the WRONG implementation.
    execFileSync("npx", ["tsc"], { cwd: PACKAGE_ROOT, timeout: 120_000 });
    if (!existsSync(DIST_ENTRY)) {
      throw new Error(`tsc build produced no ${DIST_ENTRY}`);
    }
  }, 150_000);

  it("platform fact: Object.assign(process.env, {fn}) stringifies — the v1 mechanism cannot work", () => {
    const result = runNode(
      `Object.assign(process.env, { getString: (k) => k });
       console.log(typeof process.env.getString);`
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("string"); // NOT "function"
  });

  it("shipped implementation: helpers are callable on real process.env", () => {
    const result = runNode(
      `const { EnvManager } = require(${JSON.stringify(DIST_ENTRY)});
       process.env.REAL_ENV_TEST_NUMBER = "42";
       EnvManager.extendProcessEnvPrototype();
       if (typeof process.env.getString !== "function") process.exit(2);
       if (process.env.getNumber("REAL_ENV_TEST_NUMBER", 0) !== 42) process.exit(3);
       if (process.env.getBoolean("NOPE_MISSING", true) !== true) process.exit(4);
       if (process.env.has("REAL_ENV_TEST_NUMBER") !== true) process.exit(5);
       console.log("ok");`
    );
    expect(result.stdout.trim()).toBe("ok");
    expect(result.status).toBe(0);
  });

  it("helpers do not leak into enumeration or child process environments", () => {
    const result = runNode(
      `const { EnvManager } = require(${JSON.stringify(DIST_ENTRY)});
       const { execFileSync } = require("node:child_process");
       EnvManager.extendProcessEnvPrototype();
       if (Object.keys(process.env).includes("getString")) process.exit(2);
       const childKeys = execFileSync(process.execPath,
         ["-e", "console.log(Object.keys(process.env).includes('getString'))"],
         { encoding: "utf8" });
       if (childKeys.trim() !== "false") process.exit(3);
       console.log("clean");`
    );
    expect(result.stdout.trim()).toBe("clean");
    expect(result.status).toBe(0);
  });

  it("unextendProcessEnvPrototype removes the helpers", () => {
    const result = runNode(
      `const { EnvManager } = require(${JSON.stringify(DIST_ENTRY)});
       EnvManager.extendProcessEnvPrototype();
       EnvManager.unextendProcessEnvPrototype();
       console.log(typeof process.env.getString);`
    );
    expect(result.stdout.trim()).toBe("undefined");
    expect(result.status).toBe(0);
  });

  it("in-process (jest) API surface still works after the rewrite", () => {
    const original = process.env;
    try {
      process.env = { ...original, JEST_SIDE_NUMBER: "7" } as unknown as NodeJS.ProcessEnv;
      EnvManager.resetInstance();
      EnvManager.extendProcessEnvPrototype();
      expect(typeof process.env.getNumber).toBe("function");
      expect(process.env.getNumber("JEST_SIDE_NUMBER", 0)).toBe(7);
      expect(Object.keys(process.env)).not.toContain("getNumber");
    } finally {
      EnvManager.unextendProcessEnvPrototype();
      process.env = original;
      EnvManager.resetInstance();
    }
  });
});
