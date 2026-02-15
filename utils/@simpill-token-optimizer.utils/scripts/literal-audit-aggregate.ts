/**
 * Aggregates literal-audit-raw.json: dedup, categorize, assign package, compute counts.
 * Writes literal-audit-aggregated.json for report generation.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const RAW_PATH = path.join(REPO_ROOT, "literal-audit-raw.json");

type Category =
  | "UI_COPY"
  | "API_PATH"
  | "STORAGE_KEY"
  | "HEADER"
  | "STATUS"
  | "ERROR"
  | "ANALYTICS"
  | "MAGIC_NUMBER"
  | "REGEX"
  | "PERMISSIONS"
  | "OTHER";

type Risk = "Critical" | "High" | "Medium" | "Low";

interface LiteralEntry {
  value: string | number;
  type: "string" | "number";
  file: string;
  line: number;
  column: number;
  context: string;
  snippet?: string;
}

interface AggregatedLiteral {
  value: string | number;
  type: "string" | "number";
  count: number;
  fileCount: number;
  files: string[];
  packages: string[];
  contexts: Record<string, number>;
  inLogic: boolean;
  category: Category;
  risk: Risk;
  recommendedHome: string;
}

function getPackageFromFile(filePath: string): string {
  const match = filePath.match(/[/\\]utils[/\\]([^/\\]+\.utils)/);
  return match ? match[1] : "unknown";
}

function categorize(value: string | number, type: string): Category {
  if (type === "number") {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 100 && n <= 600) return "API_PATH"; // status codes
    if (Number.isInteger(n) && (n >= 1000 || n === 0 || (n > 0 && n < 100))) return "MAGIC_NUMBER";
    return "MAGIC_NUMBER";
  }
  const s = String(value);
  if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test(s)) return "API_PATH";
  if (/^\/[a-z0-9/-]*$/i.test(s) && s.length > 1) return "API_PATH";
  if (/^[A-Z_]+_ERR|^ERR_|error|Error/.test(s) || s.includes("error")) return "ERROR";
  if (/^(pending|active|failed|success|open|closed|idle)$/i.test(s)) return "STATUS";
  if (/^[A-Z][a-z]+(Error|Exception)$/.test(s)) return "ERROR";
  if (/^x-[a-z-]+$/i.test(s) || /^[a-z-]+-key$/i.test(s)) return "HEADER";
  if (/^[a-z][a-zA-Z0-9]*\.(get|set|has|delete)$/.test(s)) return "STORAGE_KEY";
  if (/^[a-z_]+\.(track|event|page)$/i.test(s)) return "ANALYTICS";
  if (/^[A-Z_]+$/.test(s) && s.length >= 2) return "STATUS";
  if (/\.(test|spec)\.(ts|js)$/.test(s)) return "OTHER";
  if (s.startsWith("/") && s.endsWith("/")) return "REGEX";
  return "OTHER";
}

function assignRisk(count: number, fileCount: number, inLogic: boolean, category: Category): Risk {
  if (category === "ERROR" || category === "API_PATH") {
    if (fileCount >= 3 || (inLogic && count >= 2)) return "High";
    return "Medium";
  }
  if (inLogic && count >= 2) return "Medium";
  if (count >= 5 || fileCount >= 3) return "Medium";
  if (count >= 2 || fileCount >= 2) return "Low";
  return "Low";
}

function recommendedHome(pkg: string, category: Category): string {
  const base = `utils/${pkg}/src/shared`;
  if (category === "STATUS" || category === "ERROR") return `${base}/constants.ts or enums.ts`;
  if (category === "MAGIC_NUMBER") return `${base}/constants.ts`;
  if (category === "API_PATH" || category === "HEADER") return `${base}/constants.ts`;
  return `${base}/constants.ts`;
}

function main(): void {
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8")) as {
    literals: LiteralEntry[];
    fileCount: number;
    literalCount: number;
  };
  const literals: LiteralEntry[] = raw.literals;

  const byKey = new Map<string, { entries: LiteralEntry[] }>();
  for (const e of literals) {
    const key = `${e.type}:${e.value}`;
    if (!byKey.has(key)) byKey.set(key, { entries: [] });
    byKey.get(key)!.entries.push(e);
  }

  const aggregated: AggregatedLiteral[] = [];
  for (const [key, { entries }] of byKey.entries()) {
    const first = entries[0];
    const value = first.value;
    const type = first.type;
    const count = entries.length;
    const files = [...new Set(entries.map((e) => e.file))];
    const fileCount = files.length;
    const packages = [...new Set(entries.map((e) => getPackageFromFile(e.file)))];
    const contexts: Record<string, number> = {};
    for (const e of entries) {
      contexts[e.context] = (contexts[e.context] || 0) + 1;
    }
    const logicContexts = ["if", "switch-case", "ternary", "default-param", "comparison"];
    const inLogic = entries.some((e) => logicContexts.includes(e.context));
    const category = categorize(value, type);
    const risk = assignRisk(count, fileCount, inLogic, category);
    const pkg = packages[0] || "unknown";
    const recommendedHomePath = recommendedHome(pkg, category);

    aggregated.push({
      value,
      type,
      count,
      fileCount,
      files,
      packages: [...new Set(packages)],
      contexts,
      inLogic,
      category,
      risk,
      recommendedHome: recommendedHomePath,
    });
  }

  const output = {
    summary: {
      totalLiterals: raw.literalCount,
      uniqueLiteralValues: aggregated.length,
      fileCount: raw.fileCount,
    },
    aggregated,
  };
  const outPath = path.join(REPO_ROOT, "literal-audit-aggregated.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Aggregated ${aggregated.length} unique literals. Output: ${outPath}`);
}

main();
