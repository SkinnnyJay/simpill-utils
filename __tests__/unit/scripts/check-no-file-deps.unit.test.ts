/**
 * Pins the two modes of scripts/ci/check-no-file-deps.js.
 *
 * The script previously exited 1 unconditionally while printing that the
 * `file:` links it found were "expected in git for monorepo CI" — a gate that
 * always fails is not a gate, and no workflow called it. It now reports in a
 * checkout and enforces only when asked.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/ci/check-no-file-deps.js");

function run(args: string[] = []): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout?: string; stderr?: string };
    return { status: e.status, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("check-no-file-deps", () => {
  it("reports the local sibling links and succeeds in a checkout", () => {
    const { status, stdout } = run();

    expect(status).toBe(0);
    expect(stdout).toMatch(/local sibling dependencies/);
  });

  it("fails under --publish while the links are still present", () => {
    const { status, stderr } = run(["--publish"]);

    // This repo's committed state always has file: links, so --publish must
    // reject it; it is meant to run against a tree publish-all.sh has rewritten.
    expect(status).toBe(1);
    expect(stderr).toMatch(/survived the publish rewrite/);
  });

  it("names the offending package, dependency and section", () => {
    const { stderr } = run(["--publish"]);

    expect(stderr).toMatch(/@simpill-[a-z-]+\.utils: @simpill\/[a-z-]+\.utils \((dev|peer)?[Dd]ependencies\)/);
  });
});

describe("publish-order module", () => {
  it("does not run the CLI when required", () => {
    // A require that printed the publish order would mean any consumer of the
    // shared predicates also triggers the command.
    const stdout = execFileSync(
      "node",
      ["-e", `require(${JSON.stringify(path.join(REPO_ROOT, "scripts/lib/publish-order.js"))})`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );

    expect(stdout).toBe("");
  });

  it("exposes the predicates the checks share", () => {
    const exported = execFileSync(
      "node",
      [
        "-e",
        `process.stdout.write(Object.keys(require(${JSON.stringify(
          path.join(REPO_ROOT, "scripts/lib/publish-order.js")
        )})).join(","))`,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).split(",");

    expect(exported).toContain("isPackageDirName");
    expect(exported).toContain("localSimpillDeps");
    expect(exported).toContain("getPackageDirs");
  });
});
