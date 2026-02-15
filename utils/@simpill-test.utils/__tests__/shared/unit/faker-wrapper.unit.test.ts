jest.mock("@faker-js/faker", () => {
  function createSeededRng(seed: number): () => number {
    return (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }
  const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
  function createMockFaker(seed: number) {
    const rng = createSeededRng(seed);
    const hex = (): string =>
      Math.floor(rng() * 0x10000)
        .toString(16)
        .padStart(4, "0");
    return {
      string: {
        alphanumeric: (length: number): string => {
          let out = "";
          for (let i = 0; i < length; i++) {
            out += CHARS[Math.floor(rng() * CHARS.length)];
          }
          return out;
        },
        uuid: (): string =>
          `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`,
      },
      number: {
        int: (opts: { min: number; max: number }): number =>
          Math.floor(rng() * (opts.max - opts.min + 1)) + opts.min,
      },
      datatype: { boolean: (): boolean => rng() >= 0.5 },
      date: {
        between: (opts: { from: Date; to: Date }): Date =>
          new Date(opts.from.getTime() + rng() * (opts.to.getTime() - opts.from.getTime())),
      },
      helpers: {
        arrayElement: <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)] as T,
      },
    };
  }
  return {
    en: {},
    Faker: (options: { locale: unknown[]; seed: number }) => createMockFaker(options.seed),
  };
});

import { createFaker, FakerWrapper } from "../../../src/shared/faker-wrapper";

describe("FakerWrapper", () => {
  it("returns deterministic string with seed", () => {
    const f1 = createFaker({ seed: 42 });
    const f2 = createFaker({ seed: 42 });
    const s1 = f1.string(5);
    const s2 = f2.string(5);
    expect(s1.length).toBe(5);
    expect(s1).toBe(s2);
  });

  it("number is within range", () => {
    const f = new FakerWrapper({ seed: 1 });
    const n = f.number(10, 20);
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(20);
  });

  it("email uses domain", () => {
    const f = createFaker();
    expect(f.email("user")).toBe("user@example.com");
  });

  it("pick returns element from array", () => {
    const f = createFaker({ seed: 1 });
    const arr = ["a", "b", "c"];
    const v = f.pick(arr);
    expect(arr).toContain(v);
  });
});
