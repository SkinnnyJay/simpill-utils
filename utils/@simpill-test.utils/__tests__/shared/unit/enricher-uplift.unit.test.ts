import { createEnricher } from "../../../src/shared/enricher";

describe("Enricher uplift", () => {
  // REGRESSION: { ...this.defaults } shallow-copied — every enriched object
  // aliased the SAME nested defaults; one mutation corrupted them all.
  it("enriched objects do not share nested defaults", () => {
    const enricher = createEnricher({
      defaults: { name: "anon", prefs: { theme: "light" } },
    });
    const a = enricher.enrich({});
    const b = enricher.enrich({ name: "b" });
    a.prefs.theme = "dark";
    expect(b.prefs.theme).toBe("light");
    expect(enricher.enrich({}).prefs.theme).toBe("light");
  });

  it("mutating the caller's defaults object after construction has no effect", () => {
    const defaults = { name: "anon", tags: ["x"] };
    const enricher = createEnricher({ defaults });
    defaults.name = "mutated";
    defaults.tags.push("y");
    expect(enricher.enrich({})).toEqual({ name: "anon", tags: ["x"] });
  });

  it("partial values are kept by reference", () => {
    const enricher = createEnricher<{ cfg: { a: number } }>({ defaults: { cfg: { a: 1 } } });
    const mine = { a: 2 };
    expect(enricher.enrich({ cfg: mine }).cfg).toBe(mine);
  });

  it("overwriteUndefined still controls undefined handling", () => {
    const keep = createEnricher<{ a?: number }>({ defaults: { a: 1 } });
    expect(keep.enrich({ a: undefined })).toEqual({ a: 1 });
    const overwrite = createEnricher<{ a?: number }>({
      defaults: { a: 1 },
      overwriteUndefined: true,
    });
    expect(overwrite.enrich({ a: undefined })).toEqual({ a: undefined });
  });
});
