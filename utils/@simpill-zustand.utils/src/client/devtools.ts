/**
 * Devtools middleware helper for client: named store, optional enabled flag.
 */

import { devtools } from "zustand/middleware";

export type DevtoolsOptions = {
  name?: string;
  enabled?: boolean;
};

/**
 * Builds devtools middleware options. Use with create(devtools(builder, withDevtools(...))).
 */
export function withDevtools(nameOrOptions?: string | DevtoolsOptions): DevtoolsOptions {
  if (typeof nameOrOptions === "string") {
    return { name: nameOrOptions };
  }
  return nameOrOptions ?? {};
}

export { devtools };
