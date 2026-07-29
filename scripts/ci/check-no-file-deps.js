#!/usr/bin/env node
// check-no-file-deps.js — CI gate that prevents publishing packages with file: dependencies
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
  console.error("Run scripts/monorepo/use-local.sh for local dev, not file: in package.json");
  process.exit(1);
}

console.log(`Checked ${utilsDir}: no file: dependencies in production deps.`);
