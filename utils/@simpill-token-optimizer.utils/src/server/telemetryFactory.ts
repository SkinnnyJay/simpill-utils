import { createAnalyticsTelemetryStorage } from "../shared/analyticsTelemetryStorage";
import { ERROR_MESSAGES } from "../shared/constants";
import { analytics } from "../shared/stubs/analytics";
import {
  type JsonTelemetryStorageConfig,
  type TelemetryStorage,
  telemetryStorageKindSchema,
} from "../shared/telemetry.types";
import { createJsonTelemetryStorage } from "./telemetryStorage";

export interface TelemetryFactoryOptions {
  readonly jsonConfig?: JsonTelemetryStorageConfig;
  readonly environment?: NodeJS.ProcessEnv;
  readonly compressionType?: string;
  readonly agentId?: string;
  readonly chatId?: string;
  readonly useJsonFallback?: boolean;
}

const DEFAULT_JSON_PATH = "./data/telemetry/analytics.json";

const resolveEnvValue = (
  env: NodeJS.ProcessEnv | undefined,
  key: string,
  defaultValue: string,
): string => {
  const value = env?.[key];
  return value ?? defaultValue;
};

export const createTelemetryStorage = (options?: TelemetryFactoryOptions): TelemetryStorage => {
  const env = options?.environment ?? (typeof process !== "undefined" ? process.env : undefined);

  const rawKind = resolveEnvValue(env, "TELEMETRY_STORAGE_KIND", "JSON");
  const kind = telemetryStorageKindSchema.parse(rawKind.toUpperCase());

  const jsonFilePath = resolveEnvValue(env, "TELEMETRY_JSON_PATH", DEFAULT_JSON_PATH);
  const jsonConfig = options?.jsonConfig ?? { filePath: jsonFilePath };
  const jsonStorage = createJsonTelemetryStorage(jsonConfig);

  const enableAnalytics =
    resolveEnvValue(env, "TOKEN_OPTIMIZER_ANALYTICS_ENABLED", "true") !== "false";

  if (enableAnalytics) {
    const useJsonFallback = options?.useJsonFallback ?? true;

    return createAnalyticsTelemetryStorage({
      analyticsService: analytics,
      compressionType: options?.compressionType,
      agentId: options?.agentId,
      chatId: options?.chatId,
      fallbackStorage: useJsonFallback ? jsonStorage : undefined,
    });
  }

  if (kind === "JSON") {
    return jsonStorage;
  }

  throw new Error(ERROR_MESSAGES.UNSUPPORTED_TELEMETRY_STORAGE_KIND_PREFIX + kind);
};
