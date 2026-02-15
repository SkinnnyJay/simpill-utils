/**
 * Reads literal-audit-aggregated.json and writes a detailed markdown report:
 * summary, findings table (logic + duplicated literals), per-package recommendations.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const AGGREGATED_PATH = path.join(REPO_ROOT, "literal-audit-aggregated.json");
const RAW_PATH = path.join(REPO_ROOT, "literal-audit-raw.json");
const REPORT_PATH = path.join(REPO_ROOT, "docs", "LITERAL_AUDIT_FINDINGS.md");

const LOGIC_CONTEXTS = new Set(["if", "switch-case", "ternary", "default-param", "comparison"]);

interface AggregatedLiteral {
  value: string | number;
  type: "string" | "number";
  count: number;
  fileCount: number;
  files: string[];
  packages: string[];
  contexts: Record<string, number>;
  inLogic: boolean;
  category: string;
  risk: string;
  recommendedHome: string;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function shortPath(fullPath: string): string {
  const idx = fullPath.indexOf("/utils/");
  if (idx === -1) return fullPath;
  return fullPath.slice(fullPath.indexOf("/utils/") + 1);
}

function suggestedConstantName(value: string | number, category: string): string {
  if (typeof value === "number") {
    if (value >= 1000 && value < 100000) return `TIMEOUT_MS_${value}`;
    if (value >= 100 && value <= 599) return `HTTP_${value}`;
    return `VALUE_${value}`;
  }
  const s = String(value);
  if (s.length > 30) return "CONSTANT_KEY";
  const cleaned = s.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return cleaned || "KEY";
}

function main(): void {
  const data = JSON.parse(fs.readFileSync(AGGREGATED_PATH, "utf-8")) as {
    summary: { totalLiterals: number; uniqueLiteralValues: number; fileCount: number };
    aggregated: AggregatedLiteral[];
  };

  const aggregated = data.aggregated;
  const findings = aggregated.filter(
    (a) =>
      a.inLogic ||
      a.count >= 3 ||
      a.fileCount >= 2 ||
      (a.count >= 2 &&
        (a.contexts["if"] || a.contexts["comparison"] || a.contexts["default-param"])),
  );

  const byPackage = new Map<string, AggregatedLiteral[]>();
  for (const a of findings) {
    for (const pkg of a.packages) {
      if (!byPackage.has(pkg)) byPackage.set(pkg, []);
      if (!byPackage.get(pkg)!.includes(a)) byPackage.get(pkg)!.push(a);
    }
    if (a.packages.length === 0) {
      const pkg = "unknown";
      if (!byPackage.has(pkg)) byPackage.set(pkg, []);
      byPackage.get(pkg)!.push(a);
    }
  }

  const topDuplicated = [...aggregated]
    .filter((a) => a.count >= 3 || a.fileCount >= 2)
    .sort((x, y) => y.count - x.count)
    .slice(0, 30);

  const lines: string[] = [];

  lines.push("# Literal Audit Findings – utils/");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total literals (all occurrences):** ${data.summary.totalLiterals}`);
  lines.push(`- **Unique literal values:** ${data.summary.uniqueLiteralValues}`);
  lines.push(`- **Files scanned:** ${data.summary.fileCount}`);
  lines.push(`- **Findings (in logic or duplicated):** ${findings.length}`);
  lines.push("");

  lines.push("## Top duplicated literals");
  lines.push("");
  lines.push("| Literal | Type | Count | File count | Category |");
  lines.push("|---------|------|-------|------------|----------|");
  for (const a of topDuplicated) {
    const val =
      typeof a.value === "string" ? `"${escapeMd(String(a.value).slice(0, 50))}"` : a.value;
    lines.push(`| ${val} | ${a.type} | ${a.count} | ${a.fileCount} | ${a.category} |`);
  }
  lines.push("");

  lines.push("## Detailed findings table");
  lines.push("");
  lines.push(
    "Literals that appear in **logic** (if/switch/ternary/default-param/comparison) or are **repeated** (2+ in file or 3+ across repo).",
  );
  lines.push("");
  lines.push(
    "| Literal | Type | Count | Files | Category | Risk | In logic | Package(s) | Recommended home | Replacement |",
  );
  lines.push(
    "|---------|------|-------|-------|----------|------|----------|------------|------------------|-------------|",
  );

  const sortedFindings = [...findings].sort((a, b) => {
    const r = riskOrder(b.risk) - riskOrder(a.risk);
    if (r !== 0) return r;
    const pc = (a.packages[0] || "").localeCompare(b.packages[0] || "");
    if (pc !== 0) return pc;
    return b.count - a.count;
  });
  function riskOrder(r: string): number {
    switch (r) {
      case "Critical":
        return 4;
      case "High":
        return 3;
      case "Medium":
        return 2;
      case "Low":
        return 1;
      default:
        return 0;
    }
  }

  for (const a of sortedFindings) {
    const val =
      typeof a.value === "string"
        ? `"${escapeMd(String(a.value).slice(0, 40))}${String(a.value).length > 40 ? "…" : ""}"`
        : String(a.value);
    const home = a.recommendedHome;
    const repl = suggestedConstantName(a.value, a.category);
    const pkgs = a.packages.slice(0, 3).join(", ") + (a.packages.length > 3 ? "…" : "");
    lines.push(
      `| ${val} | ${a.type} | ${a.count} | ${a.fileCount} | ${a.category} | ${a.risk} | ${a.inLogic ? "yes" : ""} | ${escapeMd(pkgs)} | ${escapeMd(home)} | \`${repl}\` |`,
    );
  }
  lines.push("");

  lines.push("## Literals in logic (complete list)");
  lines.push("");
  lines.push(
    "Every occurrence of a string or number literal inside an **if**, **switch case**, **ternary**, **default parameter**, or **comparison** (===, !==, <, >, etc.).",
  );
  lines.push("");
  let raw: {
    literals: {
      value: string | number;
      type: string;
      file: string;
      line: number;
      context: string;
    }[];
  };
  try {
    raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
  } catch {
    raw = { literals: [] };
  }
  const inLogic = raw.literals
    .filter((e) => LOGIC_CONTEXTS.has(e.context))
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  lines.push("| Value | Type | Context | File | Line |");
  lines.push("|-------|------|---------|------|------|");
  for (const e of inLogic) {
    const val =
      typeof e.value === "string"
        ? `"${escapeMd(String(e.value).slice(0, 35))}${String(e.value).length > 35 ? "…" : ""}"`
        : String(e.value);
    const file = shortPath(e.file);
    lines.push(
      "| " + val + " | " + e.type + " | " + e.context + " | " + file + " | " + e.line + " |",
    );
  }
  lines.push("");
  lines.push("**Total: " + inLogic.length + " literal occurrences in logic.**");
  lines.push("");

  lines.push("## Per-package centralization recommendations");
  lines.push("");
  lines.push(
    "Constants/enums should live in each package directory under src/shared/constants.ts or src/shared/enums.ts.",
  );
  lines.push("");

  const sortedPackages = [...byPackage.keys()].filter((p) => p !== "unknown").sort();
  for (const pkg of sortedPackages) {
    const items = byPackage.get(pkg)!;
    const withLogic = items.filter((a) => a.inLogic);
    const constants = items
      .filter(
        (a) => a.category === "MAGIC_NUMBER" || a.category === "STATUS" || a.category === "ERROR",
      )
      .slice(0, 15);
    lines.push("### " + pkg);
    lines.push("");
    lines.push(
      "- **Findings in this package:** " + items.length + " (" + withLogic.length + " in logic)",
    );
    const homePath = "utils/" + pkg + "/src/shared/constants.ts";
    lines.push("- **Recommended home:** " + homePath + " (or enums.ts for status/error sets).");
    lines.push("");
    if (constants.length > 0) {
      lines.push("Suggested constants (add to package constants file):");
      const fence = String.fromCharCode(96, 96, 96);
      lines.push(fence + "typescript");
      for (const c of constants) {
        const name = suggestedConstantName(c.value, c.category);
        if (c.type === "number") {
          lines.push("export const " + name + " = " + c.value + ";");
        } else {
          lines.push("export const " + name + ' = "' + escapeMd(String(c.value)) + '";');
        }
      }
      lines.push(fence);
      lines.push("");
    }
    lines.push("Files with findings:");
    const fileSet = new Set<string>();
    for (const a of items) {
      for (const f of a.files) {
        if (getPackageFromFile(f) === pkg) fileSet.add(shortPath(f));
      }
    }
    for (const f of [...fileSet].sort().slice(0, 20)) {
      lines.push("- " + f);
    }
    if (fileSet.size > 20) lines.push(`- … and ${fileSet.size - 20} more`);
    lines.push("");
  }

  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  console.log(`Report written: ${REPORT_PATH}`);
}

function getPackageFromFile(filePath: string): string {
  const match = filePath.match(/[/\\]utils[/\\]([^/\\]+\.utils)/);
  return match ? match[1] : "unknown";
}

main();
