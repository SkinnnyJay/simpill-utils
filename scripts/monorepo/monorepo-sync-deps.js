#!/usr/bin/env node
/**
 * Sync monorepo root package.json @simpill dependencies to npm versions.
 * If utils/@simpill-*.utils exists, uses each package's version (^version); otherwise uses ^1.0.0.
 * Standalone packages (own repo, not tracked under utils/) are listed in STANDALONE_SIMPILL_DEPS.
 * Run from repo root. Use npm run use:local to switch to file:./utils/ for local development.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..", "..");
const UTILS = path.join(REPO_ROOT, "utils");
const ROOT_PKG = path.join(REPO_ROOT, "package.json");

/** @simpill packages not in this repo (own git / npm only). Kept when syncing root deps. */
const STANDALONE_SIMPILL_DEPS = {
  "@simpill/acp-llm-cli": "^0.1.0",
};

function getPackageDirs() {
  if (!fs.existsSync(UTILS)) return [];
  return fs
    .readdirSync(UTILS, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        d.name.startsWith("@simpill-") &&
        d.name.endsWith(".utils")
    )
    .map((d) => d.name)
    .sort();
}

const dirs = getPackageDirs();
const deps = {};
const scannedPackageNames = new Set();

for (const dir of dirs) {
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name;
  const version = (pkg.version && String(pkg.version).trim()) || "1.0.0";
  if (name && name.startsWith("@simpill/")) {
    deps[name] = `^${version}`;
    scannedPackageNames.add(name);
  }
}

// If no utils/ or empty, preserve existing @simpill names with ^1.0.0
const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG, "utf8"));
const existing = rootPkg.dependencies || {};
if (Object.keys(deps).length === 0) {
  for (const [name, spec] of Object.entries(existing)) {
    if (name.startsWith("@simpill/")) {
      const v = spec.match(/^\^?([0-9.]+)/);
      deps[name] = v ? `^${v[1]}` : "^1.0.0";
    }
  }
}

for (const [name, spec] of Object.entries(STANDALONE_SIMPILL_DEPS)) {
  if (!deps[name]) {
    deps[name] = spec;
  }
}

const rootDeps = rootPkg.dependencies || {};
let changed = false;
for (const [name, spec] of Object.entries(deps)) {
  if (rootDeps[name] !== spec) {
    rootDeps[name] = spec;
    changed = true;
  }
}
const keepSimpillNames = new Set([
  ...scannedPackageNames,
  ...Object.keys(STANDALONE_SIMPILL_DEPS),
]);
for (const name of Object.keys(rootDeps)) {
  if (name.startsWith("@simpill/") && !keepSimpillNames.has(name)) {
    delete rootDeps[name];
    changed = true;
  }
}
rootPkg.dependencies = rootDeps;

if (changed) {
  const keys = Object.keys(rootPkg.dependencies).sort();
  const sorted = {};
  for (const k of keys) sorted[k] = rootPkg.dependencies[k];
  rootPkg.dependencies = sorted;
  fs.writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
  console.log("Updated root package.json dependencies to npm versions.");
} else {
  console.log("Root package.json already in sync.");
}
console.log("Monorepo deps:", Object.keys(deps).length, "packages (npm ^version).");
