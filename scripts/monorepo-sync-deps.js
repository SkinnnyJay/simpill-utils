#!/usr/bin/env node
/**
 * Sync monorepo package.json dependencies from utils/@simpill-*.utils.
 * Uses github:SkinnnyJay/<name>.utils so the monorepo works anywhere (clone + npm install).
 * Run from repo root when you have utils/ locally (e.g. after cloning child repos).
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const UTILS = path.join(REPO_ROOT, "utils");
const ROOT_PKG = path.join(REPO_ROOT, "package.json");
const OWNER = "SkinnnyJay";

const dirs = fs.readdirSync(UTILS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-") && d.name.endsWith(".utils"))
  .map((d) => d.name)
  .sort();

const deps = {};
for (const dir of dirs) {
  const shortName = dir.replace(/^@simpill-/, "");
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name;
  if (name && name.startsWith("@simpill/")) {
    deps[name] = `github:${OWNER}/${shortName}`;
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
const rootNames = new Set(Object.keys(rootPkg.dependencies).filter((k) => k.startsWith("@simpill/")));
const utilNames = new Set(Object.keys(deps));
for (const name of rootNames) {
  if (!utilNames.has(name)) {
    delete rootPkg.dependencies[name];
    changed = true;
  }
}
if (changed) {
  const keys = Object.keys(rootPkg.dependencies).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = rootPkg.dependencies[k];
  rootPkg.dependencies = sorted;
  fs.writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
  console.log("Updated root package.json dependencies.");
} else {
  console.log("Root package.json already in sync.");
}
console.log("Monorepo deps:", Object.keys(deps).length, "packages from utils/.");
