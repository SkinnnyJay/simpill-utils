/** Function that converts a source value to a target value. */
export type Adapter<TSource, TTarget> = (source: TSource) => TTarget;

/** Wrap a conversion function as a typed adapter. */
export function createAdapter<TSource, TTarget>(
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
