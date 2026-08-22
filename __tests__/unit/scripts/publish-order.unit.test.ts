/**
 * Guards the publish pipeline's package-discovery predicate.
 *
 * scripts/lib/publish-order.js previously matched any directory whose name
 * ended in ".utils", which admitted the acp-llm-cli git submodule into the
 * publish order. scripts/publish/publish-all.sh consumes that order verbatim
 * and runs `npm publish` for each entry, so the submodule — which is published
 * from its own repository — would have been published from here.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/lib/publish-order.js");

function publishOrder(): string[] {
  return execFileSync("node", [SCRIPT, "order", REPO_ROOT], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
}

function rootSimpillDeps(): string[] {
  const pkg = require(path.join(REPO_ROOT, "package.json"));
  return Object.keys(pkg.dependencies ?? {}).filter((d) => d.startsWith("@simpill/"));
}

const dirToPackageName = (dir: string): string => `@simpill/${dir.replace(/^@simpill-/, "")}`;

describe("publish-order discovery predicate", () => {
  it("excludes git submodules", () => {
    expect(publishOrder()).not.toContain("@simpill-acp-llm-cli.utils");
  });

  it("emits exactly the @simpill packages the root manifest depends on", () => {
    const fromOrder = publishOrder().map(dirToPackageName).sort();
    expect(fromOrder).toEqual(rootSimpillDeps().sort());
  });

  it("only emits @simpill-*.utils directories", () => {
    for (const dir of publishOrder()) {
      expect(dir).toMatch(/^@simpill-.+\.utils$/);
    }
  });

  it("orders dependencies before their dependents", () => {
    const order = publishOrder();
    const position = new Map(order.map((d, i) => [d, i]));
    for (const dir of order) {
      const pkg = require(path.join(REPO_ROOT, "utils", dir, "package.json"));
      const sections = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies];
      for (const section of sections) {
        for (const [name, spec] of Object.entries(section ?? {})) {
          if (typeof spec !== "string" || !spec.startsWith("file:../")) continue;
          const depDir = spec.replace(/^file:\.\.\//, "").replace(/\/$/, "");
          if (!position.has(depDir)) continue;
          expect(position.get(depDir)!).toBeLessThan(position.get(dir)!);
        }
      }
    }
  });
});
