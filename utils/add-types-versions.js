#!/usr/bin/env node
/**
 * Add typesVersions to each @simpill-*.utils package.json based on its exports
 * (so TypeScript resolves subpath types reliably). Idempotent.
 */
const fs = require("fs");
const path = require("path");

const utilsDir = __dirname;
const packages = fs.readdirSync(utilsDir).filter((d) => d.startsWith("@simpill-") && d.endsWith(".utils"));

for (const pkgDir of packages) {
  const pkgPath = path.join(utilsDir, pkgDir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const exports = pkg.exports;
  if (!exports || typeof exports !== "object") continue;

  const typesVersions = { "*": {} };
  for (const key of Object.keys(exports)) {
    if (key === ".") continue;
    const entry = exports[key];
    const typesPath = entry?.types ?? entry?.default?.types;
    if (typeof typesPath === "string") {
      const subpath = key.replace(/^\.\//, "");
      typesVersions["*"][subpath] = [typesPath];
    }
  }
  if (Object.keys(typesVersions["*"]).length === 0) continue;

  if (pkg.typesVersions && JSON.stringify(pkg.typesVersions) === JSON.stringify(typesVersions)) continue;
  pkg.typesVersions = typesVersions;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(pkgDir, "-> typesVersions", Object.keys(typesVersions["*"]).join(", "));
}
console.log("Done.");
