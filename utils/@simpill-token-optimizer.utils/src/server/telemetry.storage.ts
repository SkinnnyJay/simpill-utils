import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { ENCODING, ERROR_CODE, INDENT_SPACES } from "../shared/constants";
import {
  type JsonTelemetryStorageConfig,
  jsonTelemetryStorageConfigSchema,
  type TelemetryStorage,
} from "../shared/telemetry.types";
import { type AnalyticsSnapshot, analyticsSnapshotSchema } from "../shared/token-optimizer.types";
import { invalidateCachedText, readTextCached } from "./stubs/fs";

const readSnapshots = async (filePath: string): Promise<AnalyticsSnapshot[]> => {
  try {
    const content = await readTextCached(filePath);
    if (!content) {
      return [];
    }

    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((snapshot) => {
        try {
          return analyticsSnapshotSchema.parse(snapshot);
        } catch (_error) {
          return null;
        }
      })
      .filter((snapshot): snapshot is AnalyticsSnapshot => snapshot !== null);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === ERROR_CODE.ENOENT) {
      return [];
    }

    throw error;
  }
};

const writeSnapshots = async (filePath: string, snapshots: AnalyticsSnapshot[]): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(snapshots, null, INDENT_SPACES), ENCODING.UTF8);
  invalidateCachedText(filePath);
};

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "code" in error;
}

export const createJsonTelemetryStorage = (
  rawConfig: JsonTelemetryStorageConfig,
): TelemetryStorage => {
  const config = jsonTelemetryStorageConfigSchema.parse(rawConfig);

  return {
    async persistSnapshot(snapshot) {
      const sanitized = analyticsSnapshotSchema.parse(snapshot);
      const existing = await readSnapshots(config.filePath);
      existing.push(sanitized);
      await writeSnapshots(config.filePath, existing);
    },

    async fetchRecent(limit) {
      const existing = await readSnapshots(config.filePath);
      if (typeof limit === "number" && limit >= 0) {
        return existing.slice(-limit).reverse();
      }

      return existing.slice().reverse();
    },

    async purge() {
      await writeSnapshots(config.filePath, []);
    },
  };
};
