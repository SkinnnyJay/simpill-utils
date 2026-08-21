/**
 * determineEnvPaths: an explicitly empty envPaths means "load no files".
 *
 * Treating it as unset made opting out of .env loading impossible - a caller
 * asking for zero files got both defaults, and dotenvx then reported each one
 * missing. EnvManager.bootstrap already read the option this way, so the two
 * entry points disagreed about the same field.
 */

import { determineEnvPaths } from "../../../src/server/env-load";
import { DEFAULT_ENV_PATHS } from "../../../src/shared/constants";

describe("determineEnvPaths", () => {
  it("returns the defaults when no paths are given", () => {
    expect(determineEnvPaths()).toEqual(DEFAULT_ENV_PATHS);
    expect(determineEnvPaths({})).toEqual(DEFAULT_ENV_PATHS);
  });

  it("honours an explicitly empty envPaths as load-nothing", () => {
    expect(determineEnvPaths({ envPaths: [] })).toEqual([]);
  });

  it("agrees with the option EnvManager.bootstrap resolves", () => {
    // bootstrap uses `config.envPaths ?? fallback`, which keeps []. These two
    // read the same field and must not disagree.
    const viaNullish = <T>(envPaths: readonly string[] | undefined, fallback: T) =>
      envPaths ?? fallback;
    for (const envPaths of [undefined, [], [".env.custom"]] as const) {
      const expected = viaNullish(envPaths, DEFAULT_ENV_PATHS);
      expect(
        determineEnvPaths(envPaths ? { envPaths } : envPaths === undefined ? {} : { envPaths })
      ).toEqual(expected);
    }
  });

  it("still prefers a single envPath when envPaths is absent", () => {
    expect(determineEnvPaths({ envPath: ".env.one" })).toEqual([".env.one"]);
  });

  it("prefers envPaths over envPath when both are given", () => {
    expect(determineEnvPaths({ envPaths: [".env.a"], envPath: ".env.b" })).toEqual([".env.a"]);
  });
});
