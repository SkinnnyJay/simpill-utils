/**
 * Guards the manifest rewrite that runs immediately before `npm publish`.
 *
 * scripts/lib/publish-order.js `rewrite` replaces every `file:../<sibling>` spec
 * with `^<version>`. A spec it cannot resolve is unresolvable for consumers too,
 * so it must fail loudly rather than pass the local path through. Previously it
 * skipped silently and exited 0, leaving publish-all.sh's `grep '"file:'` as the
 * only thing standing between that manifest and npm.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = path.resolve(__dirname, "../../../scripts/lib/publish-order.js");

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** A throwaway repo root containing `utils/<dir>/package.json` for each entry. */
function fixture(packages: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(tmpdir(), "publish-order-"));
  roots.push(root);
  for (const [dir, manifest] of Object.entries(packages)) {
    mkdirSync(path.join(root, "utils", dir), { recursive: true });
    writeFileSync(
      path.join(root, "utils", dir, "package.json"),
      JSON.stringify(manifest, null, 2)
    );
  }
  return root;
}

function rewrite(root: string, dir: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [SCRIPT, "rewrite", dir, root], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("publish-order rewrite", () => {
  it("replaces a local sibling spec with a caret range on that sibling's version", () => {
    const root = fixture({
      "@simpill-dep.utils": { name: "@simpill/dep.utils", version: "2.3.4" },
      "@simpill-app.utils": {
        name: "@simpill/app.utils",
        version: "1.0.0",
        dependencies: { "@simpill/dep.utils": "file:../@simpill-dep.utils" },
      },
    });

    const { status, stdout } = rewrite(root, "@simpill-app.utils");

    expect(status).toBe(0);
    expect(JSON.parse(stdout).dependencies["@simpill/dep.utils"]).toBe("^2.3.4");
  });

  it("rewrites devDependencies and peerDependencies too", () => {
    const root = fixture({
      "@simpill-dep.utils": { name: "@simpill/dep.utils", version: "5.0.1" },
      "@simpill-app.utils": {
        name: "@simpill/app.utils",
        version: "1.0.0",
        devDependencies: { "@simpill/dep.utils": "file:../@simpill-dep.utils" },
        peerDependencies: { "@simpill/dep.utils": "file:../@simpill-dep.utils" },
      },
    });

    const pkg = JSON.parse(rewrite(root, "@simpill-app.utils").stdout);

    expect(pkg.devDependencies["@simpill/dep.utils"]).toBe("^5.0.1");
    expect(pkg.peerDependencies["@simpill/dep.utils"]).toBe("^5.0.1");
  });

  it("leaves third-party specs untouched", () => {
    const root = fixture({
      "@simpill-app.utils": {
        name: "@simpill/app.utils",
        version: "1.0.0",
        dependencies: { zod: "^3.23.0" },
      },
    });

    expect(JSON.parse(rewrite(root, "@simpill-app.utils").stdout).dependencies.zod).toBe("^3.23.0");
  });

  it("fails when the sibling is private, naming the dependency", () => {
    const root = fixture({
      "@simpill-secret.utils": { name: "@simpill/secret.utils", version: "2.0.0", private: true },
      "@simpill-app.utils": {
        name: "@simpill/app.utils",
        version: "1.0.0",
        dependencies: { "@simpill/secret.utils": "file:../@simpill-secret.utils" },
      },
    });

    const { status, stdout, stderr } = rewrite(root, "@simpill-app.utils");

    expect(status).toBe(1);
    expect(stderr).toContain("@simpill/secret.utils");
    expect(stdout).not.toContain("file:");
  });

  it("fails when the sibling directory does not exist", () => {
    const root = fixture({
      "@simpill-app.utils": {
        name: "@simpill/app.utils",
        version: "1.0.0",
        dependencies: { "@simpill/ghost.utils": "file:../@simpill-ghost.utils" },
      },
    });

    const { status, stderr } = rewrite(root, "@simpill-app.utils");

    expect(status).toBe(1);
    expect(stderr).toContain("@simpill/ghost.utils");
  });

  it("rejects a package-dir that does not follow the naming convention", () => {
    const root = fixture({ "@simpill-app.utils": { name: "@simpill/app.utils", version: "1.0.0" } });

    const { status, stderr } = rewrite(root, "not-a-package");

    expect(status).toBe(1);
    expect(stderr).toContain("@simpill-<name>.utils");
  });

  it("exits non-zero with usage when given no command", () => {
    try {
      execFileSync("node", [SCRIPT], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      throw new Error("expected a non-zero exit");
    } catch (err) {
      const e = err as { status: number; stderr: string };
      expect(e.status).toBe(1);
      expect(e.stderr).toContain("Usage:");
    }
  });
});
