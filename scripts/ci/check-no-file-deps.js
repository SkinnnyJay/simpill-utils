#!/usr/bin/env node
/**
 * check-no-file-deps.js — report or forbid local sibling dependencies.
 *
 * Packages depend on each other through `file:../<sibling>` so the monorepo
 * builds and tests against working copies. publish-all.sh rewrites those specs
 * to `^<version>` immediately before `npm publish`, because a `file:` spec in a
 * published tarball is unresolvable for consumers.
 *
 * That gives the check two jobs, and it needs to be told which one:
 *
 *   node check-no-file-deps.js             report the links, exit 0
 *   node check-no-file-deps.js --publish   any link is a violation, exit 1
 *
 * Run bare against a checkout, `--publish` against a rewritten tree. Previously
 * this always exited 1 while printing that the links were expected, so it could
 * not be used as a gate anywhere and no workflow called it.
 *
 * The package set and the dependency predicate come from publish-order.js, so
 * this cannot disagree with what actually gets published.
 */
const path = require("path");
const fs = require("fs");
const { getPackageDirs, localSimpillDeps } = require("../lib/publish-order");

const PUBLISH_MODE = process.argv.includes("--publish");
const utilsDir = path.join(__dirname, "../../utils");

const links = [];
for (const dir of getPackageDirs(utilsDir)) {
  const pkg = JSON.parse(fs.readFileSync(path.join(utilsDir, dir, "package.json"), "utf8"));
  for (const { section, name, dir: target } of localSimpillDeps(pkg)) {
    links.push({ dir, section, name, target });
  }
}

if (links.length === 0) {
  console.log(
    PUBLISH_MODE
      ? "No file: dependencies remain — safe to publish."
      : `Checked ${utilsDir}: no file: dependencies.`
  );
  process.exit(0);
}

const describe = (l) => `  ${l.dir}: ${l.name} (${l.section}) -> ${l.target}`;

if (!PUBLISH_MODE) {
  console.log(`${links.length} local sibling dependencies, as expected in a checkout:`);
  links.forEach((l) => console.log(describe(l)));
  console.log("Run with --publish against a rewritten tree to enforce their absence.");
  process.exit(0);
}

console.error("ERROR: file: dependencies survived the publish rewrite:");
links.forEach((l) => console.error(describe(l)));
console.error("Publishing these would ship an unresolvable spec. Run publish-all.sh's rewrite first.");
process.exit(1);
