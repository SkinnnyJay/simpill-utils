#!/usr/bin/env node
/**
 * Rewrite each utils package to use file:../@simpill-<name>.utils for @simpill deps
 * so that build/test use local packages. Run from repo root.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const UTILS = path.join(REPO_ROOT, "utils");
const OWNER = "SkinnnyJay";

const dirs = fs
  .readdirSync(UTILS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-") && d.name.endsWith(".utils"))
  .map((d) => d.name)
  .sort();

let changed = 0;
for (const dir of dirs) {
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  for (const key of ["dependencies", "devDependencies"]) {
    const section = pkg[key];
    if (!section || typeof section !== "object") continue;
    for (const [name, spec] of Object.entries(section)) {
      if (!name.startsWith("@simpill/") || typeof spec !== "string") continue;
      const m = spec.match(/^github:([^/]+)\/(.+)$/);
      if (m && m[1] === OWNER && m[2].endsWith(".utils")) {
        const depDir = `@simpill-${m[2]}`;
        if (depDir !== dir && dirs.includes(depDir)) {
          section[name] = `file:../${depDir}`;
          changed++;
        }
      }
    }
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}
console.log("Updated", changed, "dependency entries to file:../ in utils packages.");
process.exit(0);
