import {
  compareUUIDs,
  generateUUID,
  generateUUIDv1,
  generateUUIDv4,
  generateUUIDv5,
  isUUID,
  parseUUID,
  UUIDHelper,
  validateUUID,
} from "../../../src/shared";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("uuid.utils", () => {
  describe("generateUUID", () => {
    it("returns a valid v4 UUID string", () => {
      const id = generateUUID();
      expect(validateUUID(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe("generateUUIDv4", () => {
    it("returns a valid v4 UUID", () => {
      const id = generateUUIDv4();
      expect(validateUUID(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/i);
    });
  });

  describe("generateUUIDv1", () => {
    it("returns a valid v1 UUID", () => {
      const id = generateUUIDv1();
      expect(validateUUID(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-/i);
    });
  });

  describe("generateUUIDv5", () => {
    it("returns deterministic UUID for same name and namespace", () => {
      const a = generateUUIDv5("example.com", NAMESPACE_DNS);
      const b = generateUUIDv5("example.com", NAMESPACE_DNS);
      expect(a).toBe(b);
      expect(validateUUID(a)).toBe(true);
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-/i);
    });
  });

  describe("parseUUID", () => {
    it("returns string for valid UUID", () => {
      expect(parseUUID(validUUID)).toBe(validUUID);
    });
    it("returns null for invalid string", () => {
      expect(parseUUID("not-a-uuid")).toBe(null);
      expect(parseUUID("")).toBe(null);
    });
    it("returns null for non-string", () => {
      expect(parseUUID(null as unknown as string)).toBe(null);
    });
  });

  describe("validateUUID", () => {
    it("returns true for valid UUID", () => {
      expect(validateUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });
    it("returns false for invalid string", () => {
      expect(validateUUID("not-a-uuid")).toBe(false);
    });
  });

  describe("isUUID", () => {
    it("returns true for valid UUID", () => {
      expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });
    it("returns false for invalid string", () => {
      expect(isUUID("x")).toBe(false);
    });
  });

  describe("compareUUIDs", () => {
    it("returns true when equal", () => {
      const u = "550e8400-e29b-41d4-a716-446655440000";
      expect(compareUUIDs(u, u)).toBe(true);
    });
    it("returns false when different", () => {
      expect(
        compareUUIDs(
          "550e8400-e29b-41d4-a716-446655440000",
          "550e8400-e29b-41d4-a716-446655440001",
        ),
      ).toBe(false);
    });
  });

  describe("UUIDHelper", () => {
    it("exposes all helpers", () => {
      const id = UUIDHelper.generateUUID();
      expect(UUIDHelper.validateUUID(id)).toBe(true);
      expect(UUIDHelper.isUUID(id)).toBe(true);
      expect(UUIDHelper.parseUUID(id)).toBe(id);
      expect(UUIDHelper.compareUUIDs(id, id)).toBe(true);
    });
  });
});
