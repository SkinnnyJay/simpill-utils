#!/usr/bin/env node
/**
 * Rewrite root package.json so @simpill deps point to local utils (file:./utils/@simpill-*.utils).
 * Run from repo root. After this, run npm install so root uses built local packages.
 * Use npm run sync:deps to restore github: deps.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const UTILS = path.join(REPO_ROOT, "utils");
const ROOT_PKG = path.join(REPO_ROOT, "package.json");

const dirs = fs
  .readdirSync(UTILS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-") && d.name.endsWith(".utils"))
  .map((d) => d.name)
  .sort();

const deps = {};
for (const dir of dirs) {
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name;
  if (name && name.startsWith("@simpill/")) {
    deps[name] = `file:./utils/${dir}`;
  }
}

const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG, "utf8"));
rootPkg.dependencies = rootPkg.dependencies || {};
let changed = false;
for (const [name, spec] of Object.entries(deps)) {
  if (rootPkg.dependencies[name] !== spec) {
    rootPkg.dependencies[name] = spec;
    changed = true;
  }
}
if (changed) {
  const keys = Object.keys(rootPkg.dependencies).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = rootPkg.dependencies[k];
  rootPkg.dependencies = sorted;
  fs.writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
  console.log("Root package.json now uses file:./utils/@simpill-*.utils. Run: npm install");
} else {
  console.log("Root already points to local utils.");
}
