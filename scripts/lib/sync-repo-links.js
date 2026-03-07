#!/usr/bin/env node
/**
 * Set repository, homepage, and bugs to a single monorepo base for all utils packages.
 * Run from repo root or with REPO_ROOT; writes in place. Commit after running.
 *
 * Usage:
 *   REPO_BASE="https://github.com/owner/repo" [BRANCH=main] node scripts/lib/sync-repo-links.js
 *
 * REPO_BASE  Base URL without trailing slash (e.g. https://github.com/SkinnnyJay/simpill-utils).
 * BRANCH     Default branch for homepage links (default: main).
 *
 * If REPO_BASE is not set, exits without changing anything.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = process.env.REPO_ROOT || DEFAULT_REPO_ROOT;
const UTILS = path.join(REPO_ROOT, "utils");
const REPO_BASE = process.env.REPO_BASE || "";
const BRANCH = process.env.BRANCH || "main";

if (!REPO_BASE) {
  console.error("REPO_BASE is not set. Example:");
  console.error('  REPO_BASE="https://github.com/SkinnnyJay/simpill-utils" BRANCH=main node scripts/lib/sync-repo-links.js');
  process.exit(1);
}

const base = REPO_BASE.replace(/\/$/, "");
const repoGit = base + ".git";
const repoIssues = base + "/issues";

let dirs;
try {
  dirs = fs.readdirSync(UTILS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith(".utils"))
    .map((e) => e.name);
} catch (err) {
  console.error("Failed to read utils:", err.message);
  process.exit(1);
}

let updated = 0;
for (const dir of dirs) {
  const pkgPath = path.join(UTILS, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const repo = {
    type: "git",
    url: repoGit,
    directory: dir,
  };
  const homepage = `${base}/tree/${BRANCH}/utils/${dir}#readme`;
  const bugs = { url: repoIssues };
  let changed = false;
  if (JSON.stringify(pkg.repository) !== JSON.stringify(repo)) {
    pkg.repository = repo;
    changed = true;
  }
  if (pkg.homepage !== homepage) {
    pkg.homepage = homepage;
    changed = true;
  }
  if (JSON.stringify(pkg.bugs) !== JSON.stringify(bugs)) {
    pkg.bugs = bugs;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("Updated:", dir);
    updated++;
  }
}
console.log("Done. Updated", updated, "packages.");
