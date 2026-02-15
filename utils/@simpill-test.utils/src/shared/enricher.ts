export type EnrichOptions<T> = {
  defaults: T;
  overwriteUndefined?: boolean;
};

export class Enricher<T extends object> {
  private readonly defaults: T;
  private readonly overwriteUndefined: boolean;

  constructor(options: EnrichOptions<T>) {
    this.defaults = { ...options.defaults };
    this.overwriteUndefined = options.overwriteUndefined ?? false;
  }

  enrich(partial: Partial<T>): T {
    const result = { ...this.defaults };
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
