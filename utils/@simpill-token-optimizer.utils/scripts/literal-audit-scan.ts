/**
 * Read-only AST scanner for string/number literals under utils/.
 * Outputs JSON for aggregation. Run: npm run literal-audit (or ts-node scripts/literal-audit-scan.ts)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const UTILS_DIR = path.resolve(
  process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.join(REPO_ROOT, "utils"),
);

const IGNORE_DIRS = new Set(["node_modules", "dist", "coverage", ".jest-cache"]);

type ContextKind =
  | "if"
  | "switch-case"
  | "ternary"
  | "default-param"
  | "comparison"
  | "object-literal"
  | "array-literal"
  | "return"
  | "assignment"
  | "call-arg"
  | "variable-decl"
  | "other";

interface LiteralEntry {
  value: string | number;
  type: "string" | "number";
  file: string;
  line: number;
  column: number;
  context: ContextKind;
  snippet?: string;
}

function collectTsJsFiles(dir: string, out: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) collectTsJsFiles(full, out);
    } else if (e.isFile() && /\.(ts|js)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      out.push(full);
    }
  }
}

function getContextKind(node: ts.Node, sourceFile: ts.SourceFile): ContextKind {
  const parent = node.parent;
  if (!parent) return "other";

  if (ts.isIfStatement(parent) && parent.expression === node) return "if";
  if (ts.isConditionalExpression(parent) && parent.condition === node) return "ternary";
  if (ts.isCaseClause(parent) && parent.expression === node) return "switch-case";
  if (ts.isParameter(parent) && parent.initializer === node) return "default-param";
  if (ts.isBinaryExpression(parent) && (parent.left === node || parent.right === node)) {
    const op = parent.operatorToken.kind;
    if (
      op === ts.SyntaxKind.EqualsEqualsToken ||
      op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      op === ts.SyntaxKind.LessThanToken ||
      op === ts.SyntaxKind.LessThanEqualsToken ||
      op === ts.SyntaxKind.GreaterThanToken ||
      op === ts.SyntaxKind.GreaterThanEqualsToken
    )
      return "comparison";
  }
  if (ts.isPropertyAssignment(parent) && parent.initializer === node) return "object-literal";
  if (ts.isShorthandPropertyAssignment(parent)) return "object-literal";
  if (ts.isArrayLiteralExpression(parent)) return "array-literal";
  if (ts.isReturnStatement(parent) && parent.expression === node) return "return";
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken)
    return "assignment";
  if (ts.isCallExpression(parent)) return "call-arg";
  if (ts.isVariableDeclaration(parent) && parent.initializer === node) return "variable-decl";

  return "other";
}

function getSnippet(source: string, pos: number, len: number, maxLen = 60): string {
  const start = Math.max(0, pos - 20);
  const end = Math.min(source.length, pos + len + 20);
  let snippet = source.slice(start, end).replace(/\s+/g, " ").trim();
  if (snippet.length > maxLen) snippet = snippet.slice(0, maxLen) + "...";
  return snippet;
}

function scanFile(filePath: string): LiteralEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath);
  const scriptKind =
    ext === ".js"
      ? ts.ScriptKind.JS
      : filePath.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const entries: LiteralEntry[] = [];

  function visit(node: ts.Node): void {
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
      const value = node.kind === ts.SyntaxKind.StringLiteral ? node.text : Number(node.text);
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const context = getContextKind(node, sourceFile);
      const snippet = getSnippet(content, node.getStart(), node.getWidth());
      entries.push({
        value: value as string | number,
        type: node.kind === ts.SyntaxKind.StringLiteral ? "string" : "number",
        file: filePath,
        line: line + 1,
        column: character + 1,
        context,
        snippet,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return entries;
}

function main(): void {
  if (!fs.existsSync(UTILS_DIR)) {
    console.error("Utils directory not found:", UTILS_DIR);
    process.exit(1);
  }
  const files: string[] = [];
  collectTsJsFiles(UTILS_DIR, files);
  const allEntries: LiteralEntry[] = [];
  const parseErrors: string[] = [];

  for (const f of files) {
    try {
      allEntries.push(...scanFile(f));
    } catch (err) {
      parseErrors.push(`${f}: ${(err as Error).message}`);
    }
  }

  const output = {
    scannedDir: UTILS_DIR,
    fileCount: files.length,
    literalCount: allEntries.length,
    parseErrors,
    literals: allEntries,
  };
  const outPath = path.join(REPO_ROOT, "literal-audit-raw.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `Literal audit: ${allEntries.length} literals in ${files.length} files. Raw output: ${outPath}`,
  );
  if (parseErrors.length > 0) console.error("Parse errors:", parseErrors.length);
}

main();
