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

/** npm scope every publishable package in this monorepo belongs to. */
const SCOPE = "@simpill/";
/** Directory naming convention under utils/: `@simpill-<name>.utils`. */
const DIR_PREFIX = "@simpill-";
const DIR_SUFFIX = ".utils";
/** Local sibling dependency spec, rewritten to `^<version>` before publish. */
const FILE_SPEC_PREFIX = "file:../";
/** Manifest sections that can carry a local sibling dependency. */
const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "peerDependencies"];

/** A directory that follows the publishable-package naming convention. */
function isPackageDirName(name) {
  return name.startsWith(DIR_PREFIX) && name.endsWith(DIR_SUFFIX);
}

/**
 * Every `@simpill/*` dependency in `pkg` that points at a local sibling, as
 * `{ section, name, dir }`. Both the publish order and the manifest rewrite
 * key off this one predicate, so they cannot drift apart.
 */
function localSimpillDeps(pkg) {
  const found = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const entries = pkg[section];
    if (!entries || typeof entries !== "object") continue;
    for (const [name, spec] of Object.entries(entries)) {
      if (!name.startsWith(SCOPE)) continue;
      if (typeof spec !== "string" || !spec.startsWith(FILE_SPEC_PREFIX)) continue;
      const dir = spec.slice(FILE_SPEC_PREFIX.length).replace(/\/$/, "");
      if (!isPackageDirName(dir)) continue;
      found.push({ section, name, dir });
    }
  }
  return found;
}

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
      if (!isPackageDirName(e.name)) continue;
      if (submodules.has(e.name)) continue;
      const pkgPath = path.join(utilsDir, e.name, "package.json");
      if (!fs.existsSync(pkgPath)) continue;
      try {
        if (JSON.parse(fs.readFileSync(pkgPath, "utf8")).private) continue;
      } catch {
        console.error(`Skipping ${e.name}: unreadable package.json`);
        continue;
      }
      dirs.push(e.name);
    }
  } catch (err) {
    throw new Error(`Failed to read ${utilsDir}: ${err.message}`);
  }
  return dirs.sort();
}

function readPackageJson(utilsDir, dir) {
  const p = path.join(utilsDir, dir, "package.json");
  const raw = fs.readFileSync(p, "utf8");
  return { obj: JSON.parse(raw), raw };
}

function collectDeps(obj) {
  return [...new Set(localSimpillDeps(obj).map((d) => d.dir))];
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
    throw new Error(`Circular dependency among: ${remaining.join(", ")}`);
  }
  return order;
}

/**
 * `packageDir`'s manifest with every local sibling spec replaced by `^<version>`.
 *
 * A `file:../` spec that survives into a published tarball is unresolvable for
 * consumers, so an unrewritable dependency is an error rather than a passthrough.
 * That happens when the target is absent, private, or a submodule — none of which
 * are in the publish set, so there is no version to point at. publish-all.sh also
 * greps the result for `"file:`; this makes the failure explicit at its source and
 * names the offending dependency instead of leaving the caller to infer it.
 */
function rewritePackageJsonForPublish(utilsDir, packageDir) {
  const packagePath = path.join(utilsDir, packageDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Not found: ${packagePath}`);
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  const versions = new Map();
  for (const dir of getPackageDirs(utilsDir)) {
    const obj = JSON.parse(fs.readFileSync(path.join(utilsDir, dir, "package.json"), "utf8"));
    if (obj.name && obj.version) versions.set(obj.name, obj.version);
  }

  const unresolved = [];
  for (const { section, name } of localSimpillDeps(pkg)) {
    const version = versions.get(name);
    if (!version) {
      unresolved.push(`${name} (${section})`);
      continue;
    }
    pkg[section][name] = `^${version}`;
  }
  if (unresolved.length) {
    throw new Error(
      `${packageDir}: cannot resolve a published version for ${unresolved.join(", ")}. ` +
        "The dependency is absent, private, or a submodule, so it is not in the publish set. " +
        "Publishing would ship an unresolvable file: spec to consumers."
    );
  }
  return JSON.stringify(pkg, null, 2);
}

const USAGE = [
  "Usage: node publish-order.js order [REPO_ROOT]",
  "       node publish-order.js rewrite <package-dir> [REPO_ROOT]",
].join("\n");

function main() {
  const cmd = process.argv[2];
  // `rewrite` takes <package-dir> at argv[3], so REPO_ROOT shifts one position.
  const repoRootArg = cmd === "rewrite" ? process.argv[4] : process.argv[3];
  const utilsDir = path.join(repoRootArg || DEFAULT_REPO_ROOT, "utils");

  if (cmd === "order") {
    for (const dir of topologicalOrder(utilsDir)) console.log(dir);
    return;
  }

  if (cmd === "rewrite") {
    const packageDir = process.argv[3];
    if (!packageDir || !isPackageDirName(path.basename(packageDir))) {
      throw new Error(
        `${USAGE}\n  package-dir must be named ${DIR_PREFIX}<name>${DIR_SUFFIX} ` +
          `(e.g. ${DIR_PREFIX}async${DIR_SUFFIX})`
      );
    }
    console.log(rewritePackageJsonForPublish(utilsDir, path.basename(packageDir)));
    return;
  }

  throw new Error(USAGE);
}

// Only run the CLI when invoked directly; `require`ing this file must not
// execute anything, so other scripts can share the predicates above rather than
// re-deriving the naming convention and drifting from it.
if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = {
  SCOPE,
  DIR_PREFIX,
  DIR_SUFFIX,
  FILE_SPEC_PREFIX,
  DEPENDENCY_SECTIONS,
  isPackageDirName,
  localSimpillDeps,
  getSubmoduleDirs,
  getPackageDirs,
  topologicalOrder,
  rewritePackageJsonForPublish,
};
