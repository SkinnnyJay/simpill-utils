/**
 * Runs token optimizer benchmark: each file × each compression type × 100 iterations (no-cache).
 * Writes JSON report to data/benchmark/reports/ and prints a console table.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { createTokenOptimizer } from "../src/server/tokenOptimizerFactory";
import type { TelemetryStorage } from "../src/shared/telemetry.types";
import type { AnalyticsSnapshot } from "../src/shared/token-optimizer.types";
import { CompressionTypeEnum } from "../src/shared/types";

const BENCHMARK_DIR = path.join(__dirname, "..", "data", "benchmark");
const REPORTS_DIR = path.join(BENCHMARK_DIR, "reports");
const ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS) || 100;

interface ManifestEntry {
  path: string;
  format: string;
  targetSizeBytes: number;
  actualBytes: number;
  seed: number;
}

function createNoOpTelemetryStorage(): TelemetryStorage {
  return {
    async persistSnapshot(): Promise<void> {},
    async fetchRecent(): Promise<AnalyticsSnapshot[]> {
      return [];
    },
    async purge(): Promise<void> {},
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (i - lo) * (sorted[hi] - sorted[lo]);
}

interface RunResult {
  ms: number;
  tokensBefore: number;
  tokensAfter: number;
  bytesBefore: number;
  bytesAfter: number;
  tokensSaved: number;
  bytesSaved: number;
}

async function runOne(
  prompt: string,
  compressionType: (typeof CompressionTypeEnum)[keyof typeof CompressionTypeEnum],
): Promise<RunResult> {
  const optimizer = createTokenOptimizer({
    telemetryStorage: createNoOpTelemetryStorage(),
  });
  const start = process.hrtime.bigint();
  const result = await optimizer.optimize({ prompt, compressionType });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  const before = result.analytics.metricsBefore;
  const after = result.analytics.metricsAfter;
  const savings = result.analytics.savings;
  return {
    ms,
    tokensBefore: before.rawPromptTokenCount,
    tokensAfter: after.optimizedPromptTokenCount,
    bytesBefore: before.rawPromptByteSize,
    bytesAfter: after.optimizedPromptByteSize,
    tokensSaved: savings.tokensSaved,
    bytesSaved: savings.bytesSaved,
  };
}

const compressionTypes = [
  CompressionTypeEnum.JSON,
  CompressionTypeEnum.MARKDOWN,
  CompressionTypeEnum.XML,
  CompressionTypeEnum.YAML,
  CompressionTypeEnum.CSV,
  CompressionTypeEnum.TOON,
  CompressionTypeEnum.TONL,
];

interface RowReport {
  file: string;
  format: string;
  compressionType: string;
  iterations: number;
  avgMs: number;
  p95Ms: number;
  avgTokensSaved: number;
  avgBytesSaved: number;
  avgCompressionRatio: number;
  inputSizeBytes: number;
  outputSizeBytesAvg: number;
}

async function main(): Promise<void> {
  const manifestPath = path.join(BENCHMARK_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("Manifest not found. Run npm run benchmark:data first.");
    process.exit(1);
  }
  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const rows: RowReport[] = [];
  const allRuns: Array<{
    file: string;
    format: string;
    compressionType: string;
    runs: RunResult[];
  }> = [];

  for (const entry of manifest) {
    const filePath = path.join(BENCHMARK_DIR, entry.path);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skip missing file: ${entry.path}`);
      continue;
    }
    const prompt = fs.readFileSync(filePath, "utf8");

    for (const compressionType of compressionTypes) {
      const runs: RunResult[] = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const r = await runOne(prompt, compressionType);
        runs.push(r);
      }
      allRuns.push({ file: entry.path, format: entry.format, compressionType, runs });

      const msSorted = runs.map((x) => x.ms).sort((a, b) => a - b);
      const avgMs = runs.reduce((s, x) => s + x.ms, 0) / runs.length;
      const avgTokensSaved = runs.reduce((s, x) => s + x.tokensSaved, 0) / runs.length;
      const avgBytesSaved = runs.reduce((s, x) => s + x.bytesSaved, 0) / runs.length;
      const avgOutputBytes = runs.reduce((s, x) => s + x.bytesAfter, 0) / runs.length;
      const avgRatio =
        runs.reduce(
          (s, x) =>
            s +
            (x.bytesBefore > 0 && x.bytesAfter > 0
              ? Math.min(x.bytesBefore / x.bytesAfter, 999)
              : 1),
          0,
        ) / runs.length;

      rows.push({
        file: entry.path,
        format: entry.format,
        compressionType,
        iterations: ITERATIONS,
        avgMs,
        p95Ms: percentile(msSorted, 95),
        avgTokensSaved,
        avgBytesSaved,
        avgCompressionRatio: avgRatio,
        inputSizeBytes: entry.actualBytes,
        outputSizeBytesAvg: Math.round(avgOutputBytes),
      });
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(REPORTS_DIR, `benchmark-${timestamp}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    summary: rows,
    rawRuns: allRuns.map(({ file, format, compressionType, runs }) => ({
      file,
      format,
      compressionType,
      runs: runs.map((r) => ({ ...r })),
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Report written to ${reportPath}`);

  console.log("\nBenchmark summary (avg ms, p95 ms, tokens saved, bytes saved, ratio)\n");
  const header =
    "file | format | compressionType | avgMs | p95Ms | tokensSaved | bytesSaved | ratio";
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of rows) {
    console.log(
      [
        r.file,
        r.format,
        r.compressionType,
        r.avgMs.toFixed(2),
        r.p95Ms.toFixed(2),
        r.avgTokensSaved.toFixed(0),
        r.avgBytesSaved.toFixed(0),
        r.avgCompressionRatio.toFixed(2),
      ].join(" | "),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
