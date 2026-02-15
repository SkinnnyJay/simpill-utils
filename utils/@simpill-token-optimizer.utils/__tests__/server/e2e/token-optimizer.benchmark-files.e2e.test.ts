import * as fs from "node:fs";
import * as path from "node:path";

import { createTokenOptimizer } from "../../../src/server/tokenOptimizerFactory";
import type { TelemetryStorage } from "../../../src/shared/telemetry.types";
import type { AnalyticsSnapshot } from "../../../src/shared/token-optimizer.types";
import { CompressionTypeEnum } from "../../../src/shared/types";

const BENCHMARK_DIR = path.join(__dirname, "..", "..", "..", "data", "benchmark");

function createInMemoryTelemetryStorage(): TelemetryStorage {
  const snapshots: AnalyticsSnapshot[] = [];
  return {
    async persistSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
      snapshots.push(snapshot);
    },
    async fetchRecent(limit?: number): Promise<AnalyticsSnapshot[]> {
      const tail = limit ? snapshots.slice(-limit) : [...snapshots];
      return tail;
    },
    async purge(): Promise<void> {
      snapshots.length = 0;
    },
  };
}

describe("token-optimizer benchmark files e2e", () => {
  let manifest: Array<{ path: string; format: string }>;

  beforeAll(() => {
    const manifestPath = path.join(BENCHMARK_DIR, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}. Run npm run benchmark:data first.`);
    }
    const raw = fs.readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(raw);
  });

  const compressionTypes = [
    CompressionTypeEnum.JSON,
    CompressionTypeEnum.MARKDOWN,
    CompressionTypeEnum.XML,
    CompressionTypeEnum.YAML,
    CompressionTypeEnum.CSV,
    CompressionTypeEnum.TOON,
    CompressionTypeEnum.TONL,
  ];

  it("optimizes each benchmark file with every compression type", async () => {
    const telemetryStorage = createInMemoryTelemetryStorage();
    const optimizer = createTokenOptimizer({ telemetryStorage });

    for (const entry of manifest) {
      const filePath = path.join(BENCHMARK_DIR, entry.path);
      expect(fs.existsSync(filePath)).toBe(true);
      const prompt = fs.readFileSync(filePath, "utf8");
      expect(prompt.length).toBeGreaterThan(0);

      for (const compressionType of compressionTypes) {
        const result = await optimizer.optimize({
          prompt,
          compressionType,
        });

        expect(result.optimizedPrompt).toBeDefined();
        expect(result.optimizedPrompt.length).toBeGreaterThanOrEqual(0);
        expect(result.analytics).toBeDefined();
        expect(result.analytics.metricsBefore.rawPromptByteSize).toBeGreaterThan(0);
        expect(result.analytics.metricsBefore.rawPromptTokenCount).toBeGreaterThanOrEqual(0);
        expect(result.metadata.compressionType).toBe(compressionType);
      }
    }
  });
});
