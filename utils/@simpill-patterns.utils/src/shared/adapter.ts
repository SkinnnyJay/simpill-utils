/** Function that converts a source value to a target value. */
export type Adapter<TSource, TTarget> = (source: TSource) => TTarget;

/**
 * Adapter pattern: wrap a conversion function as a typed Adapter<TSource, TTarget>.
 * Named createPatternAdapter to avoid collision with @simpill/adapters.utils#createAdapter.
 */
export function createPatternAdapter<TSource, TTarget>(
  adapter: Adapter<TSource, TTarget>
): Adapter<TSource, TTarget> {
  return adapter;
}

/** Apply an adapter to a source value. */
export function adapt<TSource, TTarget>(
  source: TSource,
  adapter: Adapter<TSource, TTarget>
): TTarget {
  return adapter(source);
}
