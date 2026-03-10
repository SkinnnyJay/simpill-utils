import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTelemetryStorage } from "../../../src/server/telemetryFactory";
import { createJsonTelemetryStorage } from "../../../src/server/telemetryStorage";
import { buildAnalyticsSnapshot } from "../../../src/shared/analytics";

const buildSnapshot = () =>
  buildAnalyticsSnapshot({
    before: {
      text: "before",
      estimate: { tokenCount: 4, charCount: 6, byteSize: 6 },
    },
    after: {
      text: "after",
      estimate: { tokenCount: 2, charCount: 5, byteSize: 5 },
    },
  });

const tempFile = (): string =>
  join(tmpdir(), `token-optimizer-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);

describe("token-optimizer server utilities", () => {
  it("persists analytics snapshots to JSON storage", async () => {
    const filePath = tempFile();
    const storage = createJsonTelemetryStorage({ filePath });
    const snapshot = buildSnapshot();

    await storage.persistSnapshot(snapshot);
    const results = await storage.fetchRecent();
    expect(results.length).toBe(1);

    await storage.purge();
    const afterPurge = await storage.fetchRecent();
    expect(afterPurge.length).toBe(0);

    await rm(filePath, { force: true });
  });

  it("creates telemetry storage from env settings", async () => {
    const filePath = tempFile();
    const storage = createTelemetryStorage({
      environment: {
        TOKEN_OPTIMIZER_ANALYTICS_ENABLED: "false",
        TELEMETRY_STORAGE_KIND: "JSON",
        TELEMETRY_JSON_PATH: filePath,
      },
    });

    await storage.persistSnapshot(buildSnapshot());
    const results = await storage.fetchRecent(1);
    expect(results.length).toBe(1);

    await storage.purge();
    await rm(filePath, { force: true });
  });
});
