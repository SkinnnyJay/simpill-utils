#!/usr/bin/env node
/**
 * Updates each utils package README.md:
 * - Puts an Install section at the very top (npm + GitHub)
 * - Adds npm and GitHub badges after the first line (banner) if missing
 * - Removes duplicate ## Installation section from the body
 *
 * Usage: node scripts/utils/utils-update-readme-badges.js
 */

const fs = require("fs");
const path = require("path");

const REPO = "SkinnnyJay/simpill-utils";
const REPO_URL = `https://github.com/${REPO}`;

const utilsDir = path.join(__dirname, "..", "..", "utils");
const dirs = fs
  .readdirSync(utilsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-"))
  .map((d) => d.name);

function removeSection(readme, heading) {
  const idx = readme.indexOf(heading);
  if (idx === -1) return readme;
  const afterHeading = readme.slice(idx);
  const nextH2 = afterHeading.slice(heading.length).match(/\n## /);
  const end = nextH2 ? idx + heading.length + nextH2.index : readme.length;
  const before = readme.slice(0, idx).trimEnd();
  let after = readme.slice(end).trimStart();
  after = after.replace(/^---\s*\n?/, "");
  return before + (after ? "\n\n---\n\n" + after : "");
}

for (const dir of dirs) {
  const pkgPath = path.join(utilsDir, dir, "package.json");
  const readmePath = path.join(utilsDir, dir, "README.md");
  if (!fs.existsSync(pkgPath) || !fs.existsSync(readmePath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name;
  const npmName = name.replace("/", "%2f");
  let readme = fs.readFileSync(readmePath, "utf8");

  // Remove existing ## Installation / ## Install so we don't duplicate
  readme = removeSection(readme, "## Installation");
  readme = removeSection(readme, "## Install");

  // Install block at the very top
  const installBlock = `## Install

**npm**
\`\`\`bash
npm install ${name}
\`\`\`

**GitHub** (from monorepo)
\`\`\`bash
git clone https://github.com/${REPO}.git && cd simpill-utils/utils/${dir} && npm install && npm run build
\`\`\`
Then in your project: \`npm install /path/to/simpill-utils/utils/${dir}\` or \`npm link\` from that directory.

---

`;

  // Badges after first line (banner) if not already present
  const npmBadge = `[![npm version](https://img.shields.io/npm/v/${npmName}.svg)](https://www.npmjs.com/package/${name})`;
  const ghBadge = `[![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](${REPO_URL}/tree/main/utils/${dir})`;
  const badgeLine = `\n<p align="center">\n  ${npmBadge}\n  ${ghBadge}\n</p>\n`;

  let out = installBlock + readme.trimStart();

  if (!out.includes("img.shields.io/npm/v/")) {
    const firstLineEnd = out.indexOf("\n");
    out = out.slice(0, firstLineEnd + 1) + badgeLine + out.slice(firstLineEnd + 1);
  }

  fs.writeFileSync(readmePath, out, "utf8");
  console.log("Updated:", dir);
}

console.log("Done.");
