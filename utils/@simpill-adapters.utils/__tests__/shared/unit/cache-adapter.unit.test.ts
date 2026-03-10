import { memoryCacheAdapter } from "../../../src/shared/cache-adapter";
import { VALUE_1 } from "../../../src/shared/constants";

describe("memoryCacheAdapter", () => {
  it("should get and set values", () => {
    const cache = memoryCacheAdapter<string, number>();
    expect(cache.get("a")).toBeUndefined();
    cache.set("a", VALUE_1);
    expect(cache.get("a")).toBe(VALUE_1);
  });

  it("should report has and delete", () => {
    const cache = memoryCacheAdapter<string, number>();
    cache.set("x", VALUE_1);
    expect(cache.has("x")).toBe(true);
    expect(cache.has("y")).toBe(false);
    expect(cache.delete("x")).toBe(true);
    expect(cache.delete("x")).toBe(false);
    expect(cache.get("x")).toBeUndefined();
  });
});
