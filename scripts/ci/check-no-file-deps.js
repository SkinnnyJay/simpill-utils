#!/usr/bin/env node
/**
 * check-no-file-deps.js — publish verification helper.
 *
 * In this monorepo, inter-package `file:` deps are expected in git (utils CI
 * and local builds). Publish rewrites them to ^versions; run this against a
 * rewritten tree, or rely on publish-all.sh's post-rewrite grep gate.
 *
 * Exit 1 if any publishable package still has file: in dependencies.
 */
const fs = require("fs");
const path = require("path");

const utilsDir = path.join(__dirname, "../../utils");
const violations = [];

for (const pkg of fs.readdirSync(utilsDir)) {
  if (!pkg.startsWith("@simpill-")) continue;
  const pkgJsonPath = path.join(utilsDir, pkg, "package.json");
  if (!fs.existsSync(pkgJsonPath)) continue;
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  if (pkgJson.private) continue;

  const deps = pkgJson.dependencies || {};
  for (const [dep, ver] of Object.entries(deps)) {
    if (typeof ver === "string" && ver.startsWith("file:")) {
      violations.push(`${pkg}: ${dep} = "${ver}"`);
    }
  }
}

if (violations.length > 0) {
  console.error("ERROR: file: dependencies found in publishable packages:");
  violations.forEach((v) => console.error(" ", v));
  console.error(
    "Expected in git for monorepo CI. For publish, rewrite first " +
      "(scripts/publish/publish-all.sh) then re-run this check."
  );
  process.exit(1);
}

console.log(`Checked ${utilsDir}: no file: dependencies in production deps.`);
