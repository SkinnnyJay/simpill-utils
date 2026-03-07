#!/usr/bin/env node
/**
 * Modernize all utils package READMEs: clean Install path, Usage heading,
 * Contributing link to monorepo, fix repo links, use ```ts.
 * Run from repo root: node scripts/utils/utils-modernize-readmes.js
 */

const fs = require("fs");
const path = require("path");

const REPO = "SkinnnyJay/simpill-utils";
const REPO_URL = `https://github.com/${REPO}`;
const utilsDir = path.join(__dirname, "..", "..", "utils");

const dirs = fs
  .readdirSync(utilsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("@simpill-") && d.name.endsWith(".utils"))
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
  const readmePath = path.join(utilsDir, dir, "README.md");
  const pkgPath = path.join(utilsDir, dir, "package.json");
  if (!fs.existsSync(readmePath) || !fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name;
  const npmName = name.replace("/", "%2f");
  let readme = fs.readFileSync(readmePath, "utf8");

  // Fix repo links
  readme = readme.replace(/https:\/\/github\.com\/SkinnnyJay\/simpill\//g, `${REPO_URL}/`);
  readme = readme.replace(/https:\/\/github\.com\/simpill\//g, `${REPO_URL}/`);

  // Quick Start -> Usage
  readme = readme.replace(/\n## Quick Start\n/g, "\n## Usage\n");

  // typescript -> ts for code blocks
  readme = readme.replace(/```typescript\n/g, "```ts\n");

  // Replace ## Development and ## Documentation with single ## Contributing
  readme = removeSection(readme, "## Development");
  readme = removeSection(readme, "## Documentation");
  const contributingBlock = "\n## Contributing\n\n- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.\n\n---\n\n";
  if (!readme.includes("## Contributing")) {
    readme = readme.replace(/\n---\s*\n\s*## License\n/, contributingBlock + "## License\n");
  }

  // Collapse duplicate --- after Install (max one)
  readme = readme.replace(/\n---\s*\n\s*\n---\s*\n/g, "\n---\n\n");

  fs.writeFileSync(readmePath, readme, "utf8");
  console.log("Modernized:", dir);
}

console.log("Done.");
