import { VALUE_0, VALUE_1 } from "./constants";

/** Per-build context passed to function-form defaults and extensions. */
export interface BuildContext {
  /** 1-based, increments on every build of this factory; reset with rewindSequence(). */
  sequence: number;
}

/** Overrides for a single buildList item: a partial or an index-keyed partial producer. */
export type ListOverrides<T> = Partial<T> | ((index: number, context: BuildContext) => Partial<T>);

/** Factory returned by createFactory: callable, plus list/derivation/sequence helpers. */
export interface FactoryFn<T extends object> {
  (overrides?: Partial<T>): T;
  /** Builds `count` items; overrides may be a shared partial or (index, context) => partial. */
  buildList(count: number, overrides?: ListOverrides<T>): T[];
  /** Derives a new factory whose defaults are this factory's output merged (shallow) with `extension`. */
  extend(extension: Partial<T> | ((context: BuildContext) => Partial<T>)): FactoryFn<T>;
  /** Resets this factory's sequence counter back to 1. */
  rewindSequence(): void;
}

type DefaultsSource<T extends object> = T | ((context: BuildContext) => T);

function resolveDefaults<T extends object>(source: DefaultsSource<T>, context: BuildContext): T {
  return typeof source === "function" ? source(context) : source;
}

function makeFactory<T extends object>(source: DefaultsSource<T>): FactoryFn<T> {
  let sequence = VALUE_1;

  const build = (overrides?: Partial<T>): T => {
    const context: BuildContext = { sequence };
    sequence += VALUE_1;
    const defaults = resolveDefaults(source, context);
    if (overrides == null || Object.keys(overrides).length === VALUE_0) {
      return { ...defaults };
    }
    return { ...defaults, ...overrides };
  };

  const factory = build as FactoryFn<T>;

  factory.buildList = (count: number, overrides?: ListOverrides<T>): T[] => {
    if (!Number.isInteger(count) || count < VALUE_0) {
      throw new RangeError(`buildList count must be a non-negative integer, got ${count}`);
    }
    const items: T[] = new Array(count);
    for (let i = VALUE_0; i < count; i++) {
      items[i] =
        typeof overrides === "function" ? factory(overrides(i, { sequence })) : factory(overrides);
    }
    return items;
  };

  factory.extend = (
    extension: Partial<T> | ((context: BuildContext) => Partial<T>)
  ): FactoryFn<T> =>
    makeFactory<T>((context: BuildContext): T => {
      const base = resolveDefaults(source, context);
      const extra = typeof extension === "function" ? extension(context) : extension;
      return { ...base, ...extra };
    });

  factory.rewindSequence = (): void => {
    sequence = VALUE_1;
  };

  return factory;
}

/**
 * Factory that produces T; defaults merged (shallow) with optional overrides per call.
 *
 * Defaults may be a plain object (nested objects are shared by reference across
 * produced instances, as before) or a function `({ sequence }) => T` that runs on
 * every build — giving fresh nested objects per instance and an auto-incrementing
 * 1-based sequence. The returned factory also exposes buildList / extend /
 * rewindSequence.
 */
export function createFactory<T extends object>(defaults: DefaultsSource<T>): FactoryFn<T> {
  return makeFactory(defaults);
}
