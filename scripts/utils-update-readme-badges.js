#!/usr/bin/env node
/**
 * Updates each utils package README.md:
 * - Adds npm version badge and GitHub badge at the top
 * - Expands Installation section with "From npm" and "From GitHub"
 *
 * Usage: node scripts/utils-update-readme-badges.js
 */

const fs = require("fs");
const path = require("path");

const REPO = "SkinnnyJay/simpill";
const REPO_URL = `https://github.com/${REPO}`;

const utilsDir = path.join(__dirname, "..", "utils");
const dirs = fs
  .readdirSync(utilsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-"))
  .map((d) => d.name);

for (const dir of dirs) {
  const pkgPath = path.join(utilsDir, dir, "package.json");
  const readmePath = path.join(utilsDir, dir, "README.md");
  if (!fs.existsSync(pkgPath) || !fs.existsSync(readmePath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name; // e.g. @simpill/array.utils
  const npmName = name.replace("/", "%2f");
  const readme = fs.readFileSync(readmePath, "utf8");

  const npmBadge = `[![npm version](https://img.shields.io/npm/v/${npmName}.svg)](https://www.npmjs.com/package/${name})`;
  const ghBadge = `[![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](${REPO_URL}/tree/main/utils/${dir})`;
  const badgeLine = `\n<p align="center">\n  ${npmBadge}\n  ${ghBadge}\n</p>\n`;

  let out = readme;

  // Insert badges after first line (banner image)
  if (!out.includes("img.shields.io/npm/v/")) {
    const firstLineEnd = out.indexOf("\n");
    out = out.slice(0, firstLineEnd + 1) + badgeLine + out.slice(firstLineEnd + 1);
  }

  // Replace "## Installation" block: ensure we have From npm and From GitHub
  const installSection = `## Installation

### From npm

\`\`\`bash
npm install ${name}
\`\`\`

### From GitHub

To use this package from the monorepo source:

\`\`\`bash
git clone https://github.com/${REPO}.git
cd simpill/utils/${dir}
npm install && npm run build
\`\`\`

In your project you can then install from the local path:
\`npm install /path/to/simpill/utils/${dir}\`
or use \`npm link\` from the package directory.`;

  const installHeading = "## Installation";
  const existingInstall = out.indexOf(installHeading);
  if (existingInstall !== -1) {
    const afterInstall = out.slice(existingInstall);
    const nextH2 = afterInstall.slice(installHeading.length).match(/\n## /);
    const nextSectionStart = nextH2
      ? installHeading.length + nextH2.index
      : afterInstall.length;
    const beforeInstall = out.slice(0, existingInstall);
    const afterInstallSection = afterInstall.slice(nextSectionStart);
    out = beforeInstall + installSection + (afterInstallSection.trimStart().startsWith("\n##") ? "" : "\n\n---") + afterInstallSection;
  }

  fs.writeFileSync(readmePath, out, "utf8");
  console.log("Updated:", dir);
}

console.log("Done.");
