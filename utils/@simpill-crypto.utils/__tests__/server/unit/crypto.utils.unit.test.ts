import {
  hash,
  randomBytesHex,
  randomBytesSecure,
  timingSafeEqualBuffer,
} from "../../../src/server";

describe("crypto.utils", () => {
  describe("hash", () => {
    it("returns sha256 hex by default", () => {
      const out = hash("hello");
      expect(out).toMatch(/^[a-f0-9]{64}$/);
      expect(hash("hello")).toBe(hash("hello"));
    });
    it("accepts Buffer", () => {
      const out = hash(Buffer.from("hello"));
      expect(out).toBe(hash("hello"));
    });
    it("accepts algorithm", () => {
      const sha512 = hash("hello", "sha512");
      expect(sha512).toMatch(/^[a-f0-9]{128}$/);
    });
  });

  describe("randomBytesSecure", () => {
    it("returns Buffer of given length", () => {
      const b = randomBytesSecure(32);
      expect(Buffer.isBuffer(b)).toBe(true);
      expect(b.length).toBe(32);
    });
    it("throws for invalid length", () => {
      expect(() => randomBytesSecure(-1)).toThrow(RangeError);
      expect(() => randomBytesSecure(1.5)).toThrow(RangeError);
    });
  });

  describe("randomBytesHex", () => {
    it("returns hex string of 2*length chars", () => {
      const s = randomBytesHex(16);
      expect(s).toMatch(/^[a-f0-9]{32}$/);
      expect(s.length).toBe(32);
    });
  });

  describe("timingSafeEqualBuffer", () => {
    it("returns true for equal buffers", () => {
      const a = Buffer.from("secret");
      expect(timingSafeEqualBuffer(a, a)).toBe(true);
      expect(timingSafeEqualBuffer("a", "a")).toBe(true);
    });
    it("returns false for different buffers same length", () => {
      expect(timingSafeEqualBuffer("a", "b")).toBe(false);
    });
    it("returns false for different lengths", () => {
      expect(timingSafeEqualBuffer("ab", "a")).toBe(false);
      expect(timingSafeEqualBuffer("a", "ab")).toBe(false);
    });
  });
});
