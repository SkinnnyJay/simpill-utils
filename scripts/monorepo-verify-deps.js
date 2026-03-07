#!/usr/bin/env node
/**
 * Verify all @simpill dependencies: resolve and load each package.
 * Run from repo root after npm install.
 */
const path = require("path");
const pkg = require(path.join(process.cwd(), "package.json"));
const deps = Object.keys(pkg.dependencies || {}).filter((d) => d.startsWith("@simpill/"));

let resolved = 0;
let loaded = 0;
const loadErrors = [];

for (const d of deps) {
  try {
    require.resolve(d);
    resolved++;
  } catch (e) {
    console.error("Resolve failed:", d, e.message);
    continue;
  }
  try {
    require(d);
    loaded++;
  } catch (e) {
    loadErrors.push({ name: d, message: e.message });
  }
}

console.log("Resolvable:", resolved + "/" + deps.length);
console.log("Loadable (require):", loaded + "/" + deps.length);
if (loadErrors.length > 0) {
  console.error("Packages that did not load (may be ESM-only or need build):");
  loadErrors.forEach(({ name, message }) => console.error("  ", name, message));
}
const ok = resolved === deps.length;
process.exit(ok ? 0 : 1);
