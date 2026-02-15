import { VALUE_0 } from "./constants";

/** Factory that produces T; defaults merged (shallow) with optional overrides per call. */
export function createFactory<T extends object>(defaults: T): (overrides?: Partial<T>) => T {
  return (overrides?: Partial<T>): T => {
    if (overrides == null || Object.keys(overrides).length === VALUE_0) {
      return { ...defaults };
    }
    return { ...defaults, ...overrides };
  };
}
