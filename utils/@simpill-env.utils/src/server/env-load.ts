import dotenvx from "@dotenvx/dotenvx";
import { DEFAULT_ENV_PATHS } from "../shared/constants";
import type { DotenvxConfigOutput, EnvManagerOptions } from "./env.types";

/**
 * Resolve which .env files to load.
 *
 * An `envPaths` that is present but empty means "load none", not "use the
 * defaults". Treating it as unset made it impossible to opt out of file
 * loading: callers asking for zero files got both defaults instead, and
 * dotenvx then reported each one missing. EnvManager.bootstrap already read
 * the option this way (`config.envPaths ?? ...`), so the two entry points
 * disagreed about the same field.
 */
export function determineEnvPaths(options?: EnvManagerOptions): readonly string[] {
  if (options?.envPaths) {
    return options.envPaths;
  }
  if (options?.envPath) {
    return [options.envPath];
  }
  return DEFAULT_ENV_PATHS;
}

export function loadEnvFiles(
  envCache: Map<string, string>,
  rawCache: Map<string, string>,
  options?: EnvManagerOptions
): void {
  const envPaths = determineEnvPaths(options);
  const overload = options?.overload ?? false;

  for (const envPath of envPaths) {
    const result: DotenvxConfigOutput = dotenvx.config({
      path: envPath,
      quiet: true,
      overload,
    });
    if (!result.parsed || Object.keys(result.parsed).length === 0) {
      continue;
    }
    for (const [key, value] of Object.entries(result.parsed)) {
      rawCache.set(key, value);
      envCache.set(key, value);
    }
  }
}

export function applyOverrides(
  envCache: Map<string, string>,
  rawCache: Map<string, string>,
  overrides?: Readonly<Record<string, string>>
): void {
  if (!overrides) {
    return;
  }
  for (const [key, value] of Object.entries(overrides)) {
    envCache.set(key, value);
    // rawCache must track overrides too: previously getRawValue() and
    // isEncrypted() kept serving the PRE-override raw value, so an
    // override of an encrypted key still reported isEncrypted() === true.
    rawCache.set(key, value);
  }
}

export function snapshotProcessEnv(
  envCache: Map<string, string>,
  rawCache: Map<string, string>
): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) {
      continue;
    }
    if (!rawCache.has(key)) {
      rawCache.set(key, value);
    }
    envCache.set(key, value);
  }
}
