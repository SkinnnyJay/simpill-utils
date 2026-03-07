#!/usr/bin/env node
/**
 * Set GitHub repository topics for this monorepo and all @simpill package repos
 * listed in package.json dependencies. Uses gh API (requires gh CLI authenticated).
 * Run from repo root.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PACKAGE_JSON = path.join(REPO_ROOT, "package.json");
const TOPICS_FILE = path.join(REPO_ROOT, ".github", "TOPICS.md");
const MAX_TOPICS = 20;
const ACCEPT_HEADER = "Accept: application/vnd.github.mercy-preview+json";

const { BASE_TOPICS, PACKAGE_TOPICS } = require("../lib/package-topics.js");

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", ...options });
  } catch (e) {
    if (options.ignoreStderr) return e.stdout || "";
    throw e;
  }
}

function getTopicsFromTopicsFile() {
  const content = fs.readFileSync(TOPICS_FILE, "utf8");
  const names = [];
  const re = /^\s*-\s*`([^`]+)`/gm;
  let m;
  while ((m = re.exec(content)) !== null) names.push(m[1]);
  return names.slice(0, MAX_TOPICS);
}

function setRepoTopics(repo, names) {
  const payload = JSON.stringify({ names });
  run(
    `gh api -X PUT -H "${ACCEPT_HEADER}" "repos/${repo}/topics" --input -`,
    { input: payload, cwd: REPO_ROOT }
  );
}

function getRepoTopics(repo) {
  const out = run(
    `gh api "repos/${repo}/topics" -H "${ACCEPT_HEADER}" -q '.names[]'`,
    { cwd: REPO_ROOT, ignoreStderr: true }
  );
  return out
    .trim()
    ? out.trim().split("\n").filter(Boolean)
    : [];
}

function getPackageRepos() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const repos = [];
  const deps = { ...pkg.dependencies, ...(pkg.devDependencies || {}) };
  for (const spec of Object.values(deps)) {
    const match = spec && spec.match(/github:([^#]+)/);
    if (match) repos.push(match[1]);
  }
  return [...new Set(repos)];
}

function topicsForPackageRepo(repoName) {
  // repoName is like "SkinnnyJay/env.utils" -> package "env.utils"
  const packageName = repoName.split("/").pop();
  const extra = PACKAGE_TOPICS[packageName] || [packageName.replace(".utils", "")];
  const combined = [...BASE_TOPICS, ...extra];
  return [...new Set(combined)].slice(0, MAX_TOPICS);
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyPackages = process.argv.includes("--packages-only");

  console.log("Setting GitHub topics for @simpill repos...\n");

  // 1) This monorepo (e.g. SkinnnyJay/simpill-utils)
  if (!onlyPackages) {
    const repo = run("gh repo view --json nameWithOwner -q .nameWithOwner", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
    const topics = getTopicsFromTopicsFile();
    console.log(`${repo}: ${topics.length} topics`);
    if (dryRun) {
      console.log("  (dry run)", topics.join(", "));
    } else {
      setRepoTopics(repo, topics);
      console.log("  Set:", getRepoTopics(repo).join(", "));
    }
    console.log("");
  }

  // 2) Package repos from package.json
  const packageRepos = getPackageRepos();
  console.log(`Found ${packageRepos.length} package repos in package.json\n`);

  for (const repo of packageRepos) {
    const topics = topicsForPackageRepo(repo);
    process.stdout.write(`${repo}: ${topics.length} topics ... `);
    if (dryRun) {
      console.log("(dry run)", topics.join(", "));
      continue;
    }
    try {
      setRepoTopics(repo, topics);
      const current = getRepoTopics(repo);
      console.log("OK:", current.slice(0, 8).join(", ") + (current.length > 8 ? "..." : ""));
    } catch (e) {
      console.log("FAIL:", e.message.split("\n")[0]);
    }
  }
}

main();
