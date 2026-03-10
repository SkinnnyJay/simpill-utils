#!/usr/bin/env node
/**
 * Normalize all package READMEs: full-width banner, clean HTML.
 * Run from repo root: node utils/normalize-readme-headers.js
 */
const fs = require("fs");
const path = require("path");

const utilsDir = path.join(__dirname);
const bannerPattern = /<p align="center">\s*\n\s*<img src="\.\/assets\/logo-banner\.svg" alt="([^"]+)" width="100%"\s*\/>\s*\n\s*<\/p>/;

const fullWidthBanner = (alt) =>
  `<p style="margin: 0;"><img src="./assets/logo-banner.svg" alt="${alt}" width="100%" style="display: block; max-width: 100%;" /></p>`;

let updated = 0;
const dirs = fs.readdirSync(utilsDir).filter((d) => d.startsWith("@simpill-") && d.endsWith(".utils"));

for (const dir of dirs) {
  const readmePath = path.join(utilsDir, dir, "README.md");
  if (!fs.existsSync(readmePath)) {
    console.warn("No README:", dir);
    continue;
  }
  let content = fs.readFileSync(readmePath, "utf8");
  const match = content.match(bannerPattern);
  if (!match) {
    console.warn("No banner pattern in:", dir);
    continue;
  }
  const alt = match[1];
  const newBlock = fullWidthBanner(alt);
  const newContent = content.replace(bannerPattern, newBlock);
  if (newContent !== content) {
    fs.writeFileSync(readmePath, newContent);
    updated++;
  }
}

console.log("Updated", updated, "READMEs with full-width banner.");
