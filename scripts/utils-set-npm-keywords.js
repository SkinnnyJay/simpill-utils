#!/usr/bin/env node
/**
 * Set npm package.json "keywords" from each package's TOPICS.md (if present)
 * or from the shared package-topics list. Run from repo root.
 * Requires utils/@simpill-*.utils to exist.
 *
 * Usage:
 *   node scripts/utils-set-npm-keywords.js           # update package.json from TOPICS.md or fallback
 *   node scripts/utils-set-npm-keywords.js --write-topics-md   # write TOPICS.md in each package, then update keywords
 *   node scripts/utils-set-npm-keywords.js --dry-run # print what would be set
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const UTILS_DIR = path.join(REPO_ROOT, "utils");
const MAX_KEYWORDS = 20;

const { BASE_TOPICS, PACKAGE_TOPICS } = require("./lib/package-topics.js");

function getPackageDirs() {
  if (!fs.existsSync(UTILS_DIR)) return [];
  return fs
    .readdirSync(UTILS_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        d.name.startsWith("@simpill-") &&
        d.name.endsWith(".utils")
    )
    .map((d) => ({ dir: d.name, shortName: d.name.replace(/^@simpill-/, "") }));
}

/**
 * Parse TOPICS.md format: lines like `- \`topic\``
 */
function parseTopicsMd(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const names = [];
  const re = /^\s*-\s*`([^`]+)`/gm;
  let m;
  while ((m = re.exec(content)) !== null) names.push(m[1]);
  return names.length ? names : null;
}

function getKeywordsFromFallback(shortName) {
  const extra = PACKAGE_TOPICS[shortName] || [shortName.replace(".utils", "")];
  const combined = [...BASE_TOPICS, ...extra];
  return [...new Set(combined)].slice(0, MAX_KEYWORDS);
}

function getKeywordsForPackage(pkgDir, shortName) {
  const topicsPath = path.join(UTILS_DIR, pkgDir, "TOPICS.md");
  const fromFile = parseTopicsMd(topicsPath);
  if (fromFile && fromFile.length > 0) {
    return [...new Set(["simpill", ...fromFile])].slice(0, MAX_KEYWORDS);
  }
  return getKeywordsFromFallback(shortName);
}

function writeTopicsMd(pkgDir, shortName) {
  const keywords = getKeywordsFromFallback(shortName);
  const topicsPath = path.join(UTILS_DIR, pkgDir, "TOPICS.md");
  const lines = [
    "# npm keywords (and GitHub topics)",
    "",
    "Used by `scripts/utils-set-npm-keywords.js` to set package.json keywords.",
    "Edit this file to customize; one topic per line in backticks.",
    "",
    ...keywords.map((k) => `- \`${k}\``),
    "",
  ];
  fs.writeFileSync(topicsPath, lines.join("\n"), "utf8");
  return keywords;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const writeTopicsMdFlag = process.argv.includes("--write-topics-md");

  const packages = getPackageDirs();
  if (packages.length === 0) {
    console.log("No utils/@simpill-*.utils packages found. Exiting.");
    process.exit(0);
  }

  console.log(
    writeTopicsMdFlag
      ? "Writing TOPICS.md per package and updating package.json keywords...\n"
      : "Updating package.json keywords from each package's TOPICS.md (or fallback)...\n"
  );

  for (const { dir, shortName } of packages) {
    const pkgPath = path.join(UTILS_DIR, dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;

    let keywords;
    if (writeTopicsMdFlag) {
      keywords = writeTopicsMd(dir, shortName);
      console.log(`  ${dir}: wrote TOPICS.md, keywords (${keywords.length})`);
    } else {
      keywords = getKeywordsForPackage(dir, shortName);
    }

    if (dryRun) {
      console.log(`  ${dir}: (dry run) ${keywords.slice(0, 8).join(", ")}${keywords.length > 8 ? "..." : ""}`);
      continue;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const prev = pkg.keywords || [];
    const same =
      Array.isArray(prev) &&
      prev.length === keywords.length &&
      prev.every((k, i) => k === keywords[i]);
    if (same) continue;

    pkg.keywords = keywords;
    fs.writeFileSync(
      pkgPath,
      JSON.stringify(pkg, null, 2) + "\n",
      "utf8"
    );
    console.log(`  ${dir}: updated keywords (${keywords.length})`);
  }

  console.log("\nDone.");
}

main();
