import {
  compareUUIDs,
  generateUUID,
  generateUUIDv7,
  getUUIDv7Timestamp,
  isUUIDv7,
  MAX_UUID,
  NIL_UUID,
  normalizeUUID,
  UUIDHelper,
  uuidVersion,
  validateUUID,
} from "../../../src/shared";

const V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid.utils (RFC 9562 additions)", () => {
  describe("generateUUIDv7", () => {
    it("returns a valid v7 UUID (version 7, variant 10x)", () => {
      const id = generateUUIDv7();
      expect(id).toMatch(V7_RE);
      expect(validateUUID(id)).toBe(true);
      expect(uuidVersion(id)).toBe(7);
      expect(isUUIDv7(id)).toBe(true);
    });

    it("embeds the current Unix millisecond timestamp", () => {
      const before = Date.now();
      const id = generateUUIDv7();
      const after = Date.now();
      const ts = getUUIDv7Timestamp(id);
      expect(ts).not.toBeNull();
      expect(ts as number).toBeGreaterThanOrEqual(before);
      // +5ms slack: counter overflow may legally borrow ahead of the wall clock.
      expect(ts as number).toBeLessThanOrEqual(after + 5);
    });

    it("is strictly monotonic and collision-free across 10,000 rapid generations", () => {
      const ids: string[] = [];
      for (let i = 0; i < 10_000; i++) ids.push(generateUUIDv7());
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
      for (let i = 1; i < ids.length; i++) {
        // Fixed-length lowercase hex: lexicographic order === byte order.
        expect(ids[i] > ids[i - 1]).toBe(true);
      }
    });

    it("stays monotonic and unique under a frozen clock (counter path + overflow borrow)", () => {
      const frozen = Date.now();
      const spy = jest.spyOn(Date, "now").mockReturnValue(frozen);
      try {
        const ids: string[] = [];
        for (let i = 0; i < 5_000; i++) ids.push(generateUUIDv7());
        expect(new Set(ids).size).toBe(ids.length);
        for (let i = 1; i < ids.length; i++) {
          expect(ids[i] > ids[i - 1]).toBe(true);
        }
        for (const id of ids) expect(id).toMatch(V7_RE);
      } finally {
        spy.mockRestore();
      }
    });

    it("does not regress ordering when the system clock goes backwards", () => {
      const base = Date.now();
      const spy = jest.spyOn(Date, "now");
      try {
        spy.mockReturnValue(base);
        const a = generateUUIDv7();
        spy.mockReturnValue(base - 10_000); // NTP step-back / VM time-warp
        const b = generateUUIDv7();
        const c = generateUUIDv7();
        expect(b > a).toBe(true);
        expect(c > b).toBe(true);
        expect(isUUIDv7(b)).toBe(true);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("getUUIDv7Timestamp", () => {
    it("round-trips a known timestamp", () => {
      // 017f22e2-79b0-7cc3-98c4-dc0c0c07398f is the RFC 9562 B.2 example vector
      // (Tuesday, February 22, 2022 2:22:22.00 PM GMT-05:00 = 1645557742000 ms).
      expect(getUUIDv7Timestamp("017f22e2-79b0-7cc3-98c4-dc0c0c07398f")).toBe(1_645_557_742_000);
    });
    it("returns null for non-v7 input", () => {
      expect(getUUIDv7Timestamp("550e8400-e29b-41d4-a716-446655440000")).toBe(null);
      expect(getUUIDv7Timestamp("garbage")).toBe(null);
    });
  });

  describe("validateUUID (RFC 9562 widening)", () => {
    it("accepts v6, v7, v8, Nil, and Max UUIDs", () => {
      expect(validateUUID("1ec9414c-232a-6b00-b3c8-9f6bdeced846")).toBe(true); // v6 (RFC B.1)
      expect(validateUUID("017f22e2-79b0-7cc3-98c4-dc0c0c07398f")).toBe(true); // v7 (RFC B.2)
      expect(validateUUID("2489e9ad-2ee2-8e00-8ec9-32d5f69181c0")).toBe(true); // v8 (RFC B.3)
      expect(validateUUID(NIL_UUID)).toBe(true);
      expect(validateUUID(MAX_UUID)).toBe(true);
      expect(validateUUID(MAX_UUID.toUpperCase())).toBe(true);
    });
    it("still accepts v1/v4/v5 and rejects garbage", () => {
      expect(validateUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(validateUUID("550e8400-e29b-91d4-a716-446655440000")).toBe(false); // version 9
      expect(validateUUID("550e8400-e29b-41d4-c716-446655440000")).toBe(false); // bad variant
      expect(validateUUID("not-a-uuid")).toBe(false);
      expect(validateUUID(123 as unknown as string)).toBe(false);
    });
  });

  describe("uuidVersion", () => {
    it("extracts version numbers", () => {
      expect(uuidVersion("550e8400-e29b-41d4-a716-446655440000")).toBe(4);
      expect(uuidVersion(generateUUIDv7())).toBe(7);
      expect(uuidVersion(NIL_UUID)).toBe(0);
      expect(uuidVersion(MAX_UUID)).toBe(0);
      expect(uuidVersion("nope")).toBe(null);
    });
  });

  describe("compareUUIDs (RFC 9562 case-insensitivity fix)", () => {
    it("treats case-variant spellings of the same UUID as equal", () => {
      expect(
        compareUUIDs(
          "550E8400-E29B-41D4-A716-446655440000",
          "550e8400-e29b-41d4-a716-446655440000",
        ),
      ).toBe(true);
    });
    it("still distinguishes different UUIDs", () => {
      expect(
        compareUUIDs(
          "550e8400-e29b-41d4-a716-446655440000",
          "550e8400-e29b-41d4-a716-446655440001",
        ),
      ).toBe(false);
    });
  });

  describe("normalizeUUID", () => {
    it("lowercases valid UUIDs and rejects invalid input", () => {
      expect(normalizeUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(normalizeUUID("nope")).toBe(null);
    });
  });

  describe("generateUUID native fast path", () => {
    it("still emits valid v4 UUIDs", () => {
      for (let i = 0; i < 100; i++) {
        const id = generateUUID();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      }
    });
  });

  describe("UUIDHelper", () => {
    it("exposes the new helpers and constants", () => {
      const id = UUIDHelper.generateUUIDv7();
      expect(UUIDHelper.isUUIDv7(id)).toBe(true);
      expect(UUIDHelper.uuidVersion(id)).toBe(7);
      expect(UUIDHelper.getUUIDv7Timestamp(id)).not.toBeNull();
      expect(UUIDHelper.normalizeUUID(id)).toBe(id);
      expect(UUIDHelper.NIL_UUID).toBe(NIL_UUID);
      expect(UUIDHelper.MAX_UUID).toBe(MAX_UUID);
    });
  });
});
