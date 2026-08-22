#!/usr/bin/env node
/**
 * Publish order and package.json rewrite for @simpill monorepo.
 *
 * Usage:
 *   node publish-order.js order [REPO_ROOT]
 *     Prints package directory names in topological publish order (one per line).
 *
 *   node publish-order.js rewrite <package-dir> [REPO_ROOT]
 *     Reads package-dir/package.json, replaces file:../<x> with ^<version> for
 *     @simpill deps, prints result to stdout. Use with backup/restore when publishing.
 *
 * REPO_ROOT defaults to parent of scripts/lib (repo root).
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Directory names of git submodules, read from .gitmodules. Submodules live in
 * their own repositories and are published from there, so they must never enter
 * this repo's publish order.
 */
function getSubmoduleDirs(repoRoot) {
  const gitmodules = path.join(repoRoot, ".gitmodules");
  if (!fs.existsSync(gitmodules)) return new Set();
  const names = new Set();
  for (const line of fs.readFileSync(gitmodules, "utf8").split("\n")) {
    const m = line.match(/^\s*path\s*=\s*(.+?)\s*$/);
    if (m) names.add(path.basename(m[1]));
  }
  return names;
}

/**
 * Publishable package directories under utils/.
 *
 * A directory qualifies only if it is named `@simpill-<name>.utils`, has a
 * package.json, is not marked private, and is not a git submodule. Matching on
 * the bare ".utils" suffix alone is what previously admitted the acp-llm-cli
 * submodule into the publish order, where publish-all.sh would npm-publish it.
 */
function getPackageDirs(utilsDir) {
  const repoRoot = path.dirname(utilsDir);
  const submodules = getSubmoduleDirs(repoRoot);
  const dirs = [];
  try {
    const entries = fs.readdirSync(utilsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (!e.name.startsWith("@simpill-") || !e.name.endsWith(".utils")) continue;
      if (submodules.has(e.name)) continue;
      const pkgPath = path.join(utilsDir, e.name, "package.json");
      if (!fs.existsSync(pkgPath)) continue;
      try {
        if (JSON.parse(fs.readFileSync(pkgPath, "utf8")).private) continue;
      } catch {
        console.error("Skipping " + e.name + ": unreadable package.json");
        continue;
      }
      dirs.push(e.name);
    }
  } catch (err) {
    console.error("Failed to read utils:", err.message);
    process.exit(1);
  }
  return dirs.sort();
}

function readPackageJson(utilsDir, dir) {
  const p = path.join(utilsDir, dir, "package.json");
  const raw = fs.readFileSync(p, "utf8");
  return { obj: JSON.parse(raw), raw };
}

function collectDeps(obj) {
  const deps = [];
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const section = obj[key];
    if (!section || typeof section !== "object") continue;
    for (const [name, value] of Object.entries(section)) {
      if (name.startsWith("@simpill/") && typeof value === "string" && value.startsWith("file:../")) {
        const depDir = value.replace(/^file:\.\.\//, "").replace(/\/$/, "");
        if (depDir.endsWith(".utils")) deps.push(depDir);
      }
    }
  }
  return [...new Set(deps)];
}

function topologicalOrder(utilsDir) {
  const dirs = getPackageDirs(utilsDir);
  const dirToDeps = new Map();
  for (const dir of dirs) {
    const { obj } = readPackageJson(utilsDir, dir);
    const depDirs = collectDeps(obj).filter((d) => dirs.includes(d));
    dirToDeps.set(dir, depDirs);
  }
  // inDegree[dir] = number of @simpill deps (must publish deps before dir)
  const inDegree = new Map();
  for (const dir of dirs) inDegree.set(dir, dirToDeps.get(dir).length);
  const order = [];
  let queue = dirs.filter((d) => inDegree.get(d) === 0);
  while (queue.length) {
    const d = queue.shift();
    order.push(d);
    for (const [dir, deps] of dirToDeps) {
      if (deps.includes(d)) {
        const newDeg = inDegree.get(dir) - 1;
        inDegree.set(dir, newDeg);
        if (newDeg === 0) queue.push(dir);
      }
    }
  }
  const remaining = dirs.filter((d) => !order.includes(d));
  if (remaining.length) {
    console.error("Circular dependency among:", remaining.join(", "));
    process.exit(1);
  }
  return order;
}

function rewritePackageJsonForPublish(utilsDir, packageDir) {
  const packagePath = path.join(utilsDir, packageDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    console.error("Not found:", packagePath);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const dirs = getPackageDirs(utilsDir);
  const versions = new Map();
  for (const d of dirs) {
    const obj = JSON.parse(fs.readFileSync(path.join(utilsDir, d, "package.json"), "utf8"));
    if (obj.name && obj.version) versions.set(obj.name, obj.version);
  }
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const section = pkg[key];
    if (!section || typeof section !== "object") continue;
    for (const [name, value] of Object.entries(section)) {
      if (name.startsWith("@simpill/") && typeof value === "string" && value.startsWith("file:../")) {
        const ver = versions.get(name);
        if (ver) section[name] = `^${ver}`;
      }
    }
  }
  return JSON.stringify(pkg, null, 2);
}

const cmd = process.argv[2];
const repoRoot = cmd === "rewrite" ? (process.argv[4] || DEFAULT_REPO_ROOT) : (process.argv[3] || DEFAULT_REPO_ROOT);
const utilsDir = path.join(repoRoot, "utils");

if (cmd === "order") {
  topologicalOrder(utilsDir).forEach((d) => console.log(d));
} else if (cmd === "rewrite") {
  const packageDir = process.argv[3];
  if (!packageDir || !packageDir.endsWith(".utils")) {
    console.error("Usage: node publish-order.js rewrite <package-dir> [REPO_ROOT]");
    console.error("  package-dir must end with .utils (e.g. async.utils)");
    process.exit(1);
  }
  const dirName = path.basename(packageDir);
  if (!fs.existsSync(path.join(utilsDir, dirName, "package.json"))) {
    console.error("Not found:", path.join(utilsDir, dirName, "package.json"));
    process.exit(1);
  }
  console.log(rewritePackageJsonForPublish(utilsDir, dirName));
} else {
  console.error("Usage: node publish-order.js order [REPO_ROOT]");
  console.error("       node publish-order.js rewrite <package-dir> [REPO_ROOT]");
  process.exit(1);
}
