/** Map of strategy keys to (input) => output functions. */
export type StrategyMap<K extends string, I, O> = Record<K, (input: I) => O>;

/** Returns (key, input) => output; uses defaultKey if key missing, else throws. */
export function strategySelector<K extends string, I, O>(
  strategies: StrategyMap<K, I, O>,
  options?: { defaultKey?: K }
): (key: K, input: I) => O {
  const defaultKey = options?.defaultKey;
  return (key: K, input: I): O => {
    const fn = strategies[key];
    if (fn) return fn(input);
    if (defaultKey != null) return strategies[defaultKey](input);
    throw new Error(`Unknown strategy: ${key}`);
  };
}

/** Like strategySelector but returns undefined for unknown keys instead of throwing. */
export function strategySelectorOptional<K extends string, I, O>(
  strategies: StrategyMap<K, I, O>,
  options?: { defaultKey?: K }
): (key: K, input: I) => O | undefined {
  const defaultKey = options?.defaultKey;
  return (key: K, input: I): O | undefined => {
    const fn = strategies[key];
    if (fn) return fn(input);
    if (defaultKey != null) return strategies[defaultKey](input);
    return undefined;
  };
}
