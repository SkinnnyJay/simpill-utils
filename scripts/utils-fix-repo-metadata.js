#!/usr/bin/env node
/**
 * Fix repository, bugs, homepage in each utils package for standalone GitHub repos.
 * Replaces file:../@simpill-*.utils deps with github:SkinnnyJay/<name>.utils.
 * Run from repo root. Requires utils/@simpill-*.utils to exist.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const UTILS = path.join(REPO_ROOT, "utils");
const OWNER = "SkinnnyJay";

const dirs = fs.readdirSync(UTILS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-") && d.name.endsWith(".utils"))
  .map((d) => d.name);

for (const dir of dirs) {
  const shortName = dir.replace(/^@simpill-/, "");
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  let changed = false;

  if (!pkg.repository || pkg.repository.url.includes("simpill.git")) {
    pkg.repository = { type: "git", url: `https://github.com/${OWNER}/${shortName}.git` };
    changed = true;
  }
  if (pkg.repository && pkg.repository.directory && pkg.repository.directory !== ".") {
    pkg.repository.directory = ".";
    changed = true;
  }
  if (!pkg.bugs || pkg.bugs.url.includes("simpill/issues")) {
    pkg.bugs = { url: `https://github.com/${OWNER}/${shortName}/issues` };
    changed = true;
  }
  if (!pkg.homepage || pkg.homepage.includes("simpill/tree")) {
    pkg.homepage = `https://github.com/${OWNER}/${shortName}#readme`;
    changed = true;
  }

  if (pkg.dependencies) {
    for (const [dep, spec] of Object.entries(pkg.dependencies)) {
      if (dep.startsWith("@simpill/") && typeof spec === "string" && spec.startsWith("file:../")) {
        const match = spec.match(/file:\.\.\/@simpill-(.+\.utils)/);
        if (match) {
          pkg.dependencies[dep] = `github:${OWNER}/${match[1]}`;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("Updated:", dir);
  }
}

console.log("Done. Check utils/@simpill-*.utils/package.json and commit + push each repo.");
