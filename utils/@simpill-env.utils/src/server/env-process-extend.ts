import { EnvManager } from "./env-manager";

/**
 * Extend process.env with helper methods.
 * @deprecated Mutates global process.env; use Env class instead.
 */
export function extendProcessEnvPrototype(): void {
  EnvManager.extendProcessEnvPrototype();
}
