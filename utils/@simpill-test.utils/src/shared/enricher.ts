export type EnrichOptions<T> = {
  defaults: T;
  overwriteUndefined?: boolean;
};

/** Deep-clone plain data; keep functions/class instances by reference. */
function cloneDefaults<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneDefaults(item)) as unknown as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    out[key] = cloneDefaults((value as Record<string, unknown>)[key]);
  }
  return out as T;
}

export class Enricher<T extends object> {
  private readonly defaults: T;
  private readonly overwriteUndefined: boolean;

  constructor(options: EnrichOptions<T>) {
    // Deep-clone so later caller mutations of the passed-in defaults object
    // cannot retroactively change what this enricher produces.
    this.defaults = cloneDefaults(options.defaults);
    this.overwriteUndefined = options.overwriteUndefined ?? false;
  }

  /**
   * Merge `partial` over the defaults. Nested default values are deep-cloned
   * per call: previously every enriched object aliased the SAME nested
   * defaults ({ ...this.defaults } is shallow), so mutating one result's
   * nested field silently corrupted every other result and the defaults
   * themselves. Values supplied via `partial` are kept by reference.
   */
  enrich(partial: Partial<T>): T {
    const result = cloneDefaults(this.defaults);
    for (const key of Object.keys(partial) as (keyof T)[]) {
      const val = partial[key];
      if (this.overwriteUndefined || val !== undefined) {
        (result as Record<string, unknown>)[key as string] = val;
      }
    }
    return result;
  }

  enrichMany(partials: Array<Partial<T>>): T[] {
    return partials.map((p) => this.enrich(p));
  }
}

export function createEnricher<T extends object>(options: EnrichOptions<T>): Enricher<T> {
  return new Enricher(options);
}
