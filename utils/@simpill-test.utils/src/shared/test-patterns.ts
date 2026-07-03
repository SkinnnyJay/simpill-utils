export type FixtureFactory<T> = (overrides?: Partial<T>) => T;

// AggregateError is ES2021 runtime (Node >= 15); resolved via globalThis so
// the package's ES2020 lib config stays untouched, with an Error fallback
// carrying `.errors` for environments without it.
type AggregateErrorLike = Error & { errors: unknown[] };
type AggregateErrorCtor = new (errors: unknown[], message?: string) => AggregateErrorLike;

function makeAggregateError(errors: unknown[], message: string): AggregateErrorLike {
  const Ctor = (globalThis as { AggregateError?: AggregateErrorCtor }).AggregateError;
  if (Ctor) {
    return new Ctor(errors, message);
  }
  const err = new Error(message) as AggregateErrorLike;
  err.name = "AggregateError";
  err.errors = errors;
  return err;
}

export type FixtureContext = { sequence: number };

/**
 * Deep-clone plain data (objects, arrays, Date, Map, Set) so each fixture
 * build gets FRESH nested structures. Functions, class instances, and other
 * exotic objects are intentionally kept by reference — cloning them naively
 * would break their identity/prototype semantics.
 */
function cloneData<T>(value: T, seen = new Map<object, unknown>()): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  const obj = value as unknown as object;
  const cached = seen.get(obj);
  if (cached !== undefined) {
    return cached as T;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(obj, out);
    for (const item of value) {
      out.push(cloneData(item, seen));
    }
    return out as unknown as T;
  }
  if (value instanceof Map) {
    const out = new Map<unknown, unknown>();
    seen.set(obj, out);
    for (const [k, v] of value) {
      out.set(cloneData(k, seen), cloneData(v, seen));
    }
    return out as unknown as T;
  }
  if (value instanceof Set) {
    const out = new Set<unknown>();
    seen.set(obj, out);
    for (const item of value) {
      out.add(cloneData(item, seen));
    }
    return out as unknown as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    // Class instance / exotic object: keep by reference.
    return value;
  }
  const out: Record<string, unknown> = {};
  seen.set(obj, out);
  for (const key of Object.keys(value)) {
    out[key] = cloneData((value as Record<string, unknown>)[key], seen);
  }
  return out as T;
}

export class TestPatterns {
  private teardownFns: Array<() => void | Promise<void>> = [];

  addTeardown(fn: () => void | Promise<void>): void {
    this.teardownFns.push(fn);
  }

  /**
   * Run registered teardowns in REVERSE registration order (LIFO), the
   * standard unwind order for cleanup registries (vitest onTestFinished,
   * Go defer, Python addCleanup): later-registered resources typically
   * depend on earlier ones, so they must be released first.
   *
   * ALL teardowns run even if some throw. Failures are collected and
   * rethrown together as an AggregateError (a single failure rethrows
   * as-is), instead of the previous behavior where the first throwing
   * teardown aborted the run AND silently discarded every remaining
   * teardown (the list was cleared up front), leaking those resources.
   */
  async runTeardown(): Promise<void> {
    const fns = this.teardownFns.reverse();
    this.teardownFns = [];
    const errors: unknown[] = [];
    for (const fn of fns) {
      try {
        await fn();
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw makeAggregateError(errors, `runTeardown: ${errors.length} teardown(s) failed`);
    }
  }

  /**
   * Build a fixture factory. Accepts either a base object or a base
   * function ({ sequence }) => T for dynamic per-build defaults.
   *
   * Every build deep-clones the base's plain data, so fixtures never share
   * nested structures with the base or with each other. (Previously
   * `{ ...base, ...overrides }` shallow-copied: every fixture aliased the
   * SAME nested objects, so mutating one test's fixture corrupted the base
   * and every other fixture.) Override values are kept by reference.
   */
  createFixture<T extends object>(base: T | ((ctx: FixtureContext) => T)): FixtureFactory<T> {
    let sequence = 0;
    return (overrides?: Partial<T>): T => {
      sequence += 1;
      const built =
        typeof base === "function"
          ? (base as (ctx: FixtureContext) => T)({ sequence })
          : cloneData(base);
      return overrides ? { ...built, ...overrides } : built;
    };
  }

  createDouble<TArgs extends unknown[], TReturn>(
    defaultReturn: TReturn,
  ): {
    fn: (...args: TArgs) => TReturn;
    calls: TArgs[];
    reset: () => void;
  } {
    const calls: TArgs[] = [];
    const fn = (...args: TArgs): TReturn => {
      calls.push(args);
      return defaultReturn;
    };
    const reset = (): void => {
      calls.length = 0;
    };
    return { fn, calls, reset };
  }

  createAsyncDouble<TArgs extends unknown[], TReturn>(
    resolvedValue: TReturn,
  ): {
    fn: (...args: TArgs) => Promise<TReturn>;
    calls: TArgs[];
    reset: () => void;
  } {
    const calls: TArgs[] = [];
    const fn = async (...args: TArgs): Promise<TReturn> => {
      calls.push(args);
      return resolvedValue;
    };
    const reset = (): void => {
      calls.length = 0;
    };
    return { fn, calls, reset };
  }
}

export function createTestPatterns(): TestPatterns {
  return new TestPatterns();
}
