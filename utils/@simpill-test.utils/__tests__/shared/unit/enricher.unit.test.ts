import { createEnricher } from "../../../src/shared/enricher";

describe("Enricher", () => {
  it("merges partial over defaults", () => {
    const enricher = createEnricher({
      defaults: { a: 1, b: 2, c: 3 },
    });
    expect(enricher.enrich({ a: 10 })).toEqual({ a: 10, b: 2, c: 3 });
  });

  it("enrichMany returns array", () => {
    const enricher = createEnricher({ defaults: { x: 0 } });
    expect(enricher.enrichMany([{ x: 1 }, {}])).toEqual([{ x: 1 }, { x: 0 }]);
  });
});
