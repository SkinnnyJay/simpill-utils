import {
  hasArgon2,
  hash,
  hashBuffer,
  hashPassword,
  hkdf,
  hmac,
  hmacBuffer,
  pbkdf2,
  randomBytesBase64Url,
  randomBytesHex,
  randomBytesSecure,
  randomIntSecure,
  safeEqual,
  scryptDerive,
  timingSafeEqualBuffer,
  verifyPassword,
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
    it("matches known sha256 vector", () => {
      expect(hash("hello")).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    });
    it("supports base64 and base64url encodings consistent with hex", () => {
      const hex = hash("hello");
      expect(hash("hello", "sha256", "base64")).toBe(Buffer.from(hex, "hex").toString("base64"));
      expect(hash("hello", "sha256", "base64url")).toBe(
        Buffer.from(hex, "hex").toString("base64url"),
      );
    });
    it("hashBuffer returns the raw digest", () => {
      expect(hashBuffer("hello").toString("hex")).toBe(hash("hello"));
      expect(hashBuffer("hello").length).toBe(32);
    });
  });

  describe("hmac (RFC 4231 vectors)", () => {
    it("test case 1: 20x0b key, 'Hi There'", () => {
      const key = Buffer.alloc(20, 0x0b);
      expect(hmac(key, "Hi There")).toBe(
        "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
      );
    });
    it("test case 2: 'Jefe' key", () => {
      expect(hmac("Jefe", "what do ya want for nothing?")).toBe(
        "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
      );
    });
    it("hmacBuffer matches hex output", () => {
      expect(hmacBuffer("Jefe", "what do ya want for nothing?").toString("hex")).toBe(
        hmac("Jefe", "what do ya want for nothing?"),
      );
    });
    it("supports alternate encodings", () => {
      const hex = hmac("k", "d");
      expect(hmac("k", "d", "sha256", "base64url")).toBe(
        Buffer.from(hex, "hex").toString("base64url"),
      );
    });
  });

  describe("hkdf (RFC 5869 test case 1)", () => {
    it("derives the RFC 5869 SHA-256 OKM", () => {
      const ikm = Buffer.alloc(22, 0x0b);
      const salt = Buffer.from("000102030405060708090a0b0c", "hex");
      const info = Buffer.from("f0f1f2f3f4f5f6f7f8f9", "hex");
      const okm = hkdf(ikm, { salt, info, length: 42 });
      expect(okm.toString("hex")).toBe(
        "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865",
      );
    });
    it("defaults to 32 bytes and differs by info (domain separation)", () => {
      const a = hkdf("master-key", { info: "encryption" });
      const b = hkdf("master-key", { info: "signing" });
      expect(a.length).toBe(32);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("pbkdf2 (published HMAC-SHA256 vectors)", () => {
    it("password/salt/c=1/dkLen=32", () => {
      expect(pbkdf2("password", "salt", { iterations: 1 }).toString("hex")).toBe(
        "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b",
      );
    });
    it("password/salt/c=4096/dkLen=32", () => {
      expect(pbkdf2("password", "salt", { iterations: 4096 }).toString("hex")).toBe(
        "c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a",
      );
    });
  });

  describe("scryptDerive (RFC 7914 section 12 vectors)", () => {
    it("empty password/salt, N=16", () => {
      expect(scryptDerive("", "", 64, 16, 1, 1).toString("hex")).toBe(
        "77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906",
      );
    });
    it("password/NaCl, N=1024 r=8 p=16", () => {
      expect(scryptDerive("password", "NaCl", 64, 1024, 8, 16).toString("hex")).toBe(
        "fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640",
      );
    });
  });

  describe("hashPassword / verifyPassword", () => {
    // small cost for test speed; production default is 2^17
    const fast = { cost: 1024 };
    it("round-trips a correct password", () => {
      const stored = hashPassword("hunter2", fast);
      expect(verifyPassword("hunter2", stored)).toBe(true);
    });
    it("rejects a wrong password", () => {
      const stored = hashPassword("hunter2", fast);
      expect(verifyPassword("hunter3", stored)).toBe(false);
      expect(verifyPassword("", stored)).toBe(false);
    });
    it("emits a self-describing PHC string with unique salts", () => {
      const a = hashPassword("pw", fast);
      const b = hashPassword("pw", fast);
      expect(a).toMatch(/^\$scrypt\$ln=10,r=8,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
      expect(a).not.toBe(b); // random salt
      expect(verifyPassword("pw", a)).toBe(true);
      expect(verifyPassword("pw", b)).toBe(true);
    });
    it("verifies using parameters from the stored string, not current defaults", () => {
      const stored = hashPassword("pw", { cost: 2048, blockSize: 4, parallelism: 2 });
      expect(stored).toContain("$scrypt$ln=11,r=4,p=2$");
      expect(verifyPassword("pw", stored)).toBe(true);
    });
    it("works at the OWASP default cost 2^17 (needs maxmem > Node's 32 MiB default)", () => {
      // node's scryptSync throws ERR_CRYPTO_INVALID_SCRYPT_PARAMS at N=2^17,r=8
      // unless maxmem is raised; hashPassword handles that internally.
      const stored = hashPassword("hunter2");
      expect(stored).toContain("$scrypt$ln=17,r=8,p=1$");
      expect(verifyPassword("hunter2", stored)).toBe(true);
    });
    it("throws RangeError for non-power-of-2 scrypt cost", () => {
      expect(() => hashPassword("pw", { cost: 1000 })).toThrow(RangeError);
      expect(() => hashPassword("pw", { cost: 1 })).toThrow(RangeError);
    });
    it("throws TypeError for unrecognized stored formats", () => {
      expect(() => verifyPassword("pw", "not-a-phc-string")).toThrow(TypeError);
      expect(() => verifyPassword("pw", "$md5$deadbeef")).toThrow(TypeError);
    });
    it("argon2id: works natively or fails loud with guidance", () => {
      if (hasArgon2()) {
        const stored = hashPassword("pw", { algorithm: "argon2id", memoryCost: 8192, timeCost: 2 });
        expect(stored).toMatch(/^\$argon2id\$v=19\$/);
        expect(verifyPassword("pw", stored)).toBe(true);
        expect(verifyPassword("nope", stored)).toBe(false);
      } else {
        expect(() => hashPassword("pw", { algorithm: "argon2id" })).toThrow(/Node\.js >= 26/);
      }
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

  describe("randomBytesBase64Url", () => {
    it("returns a URL-safe unpadded token", () => {
      const s = randomBytesBase64Url(32);
      expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(s).not.toContain("=");
      expect(Buffer.from(s, "base64url").length).toBe(32);
    });
    it("shares validation with randomBytesSecure", () => {
      expect(() => randomBytesBase64Url(-1)).toThrow(RangeError);
    });
  });

  describe("randomIntSecure", () => {
    it("stays within [min, max)", () => {
      for (let i = 0; i < 500; i++) {
        const n = randomIntSecure(10, 13);
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThan(13);
        expect(Number.isInteger(n)).toBe(true);
      }
    });
    it("covers the full range (statistical smoke)", () => {
      const seen = new Set<number>();
      for (let i = 0; i < 300; i++) seen.add(randomIntSecure(0, 4));
      expect(seen.size).toBe(4);
    });
    it("throws for invalid ranges", () => {
      expect(() => randomIntSecure(5, 5)).toThrow(RangeError);
      expect(() => randomIntSecure(10, 2)).toThrow(RangeError);
      expect(() => randomIntSecure(0.5, 2)).toThrow(RangeError);
      expect(() => randomIntSecure(0, 2 ** 48)).toThrow(RangeError);
    });
  });

  describe("timingSafeEqualBuffer (back-compat)", () => {
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

  describe("safeEqual (length-independent constant time)", () => {
    it("returns true for equal inputs, mixing string and Buffer", () => {
      expect(safeEqual("token-value", "token-value")).toBe(true);
      expect(safeEqual(Buffer.from("token-value"), "token-value")).toBe(true);
      expect(safeEqual(Buffer.alloc(0), "")).toBe(true);
    });
    it("returns false for unequal inputs of any lengths", () => {
      expect(safeEqual("a", "b")).toBe(false);
      expect(safeEqual("ab", "a")).toBe(false);
      expect(safeEqual("a", "ab")).toBe(false);
      expect(safeEqual("", "x")).toBe(false);
    });
    it("agrees with strict equality across random inputs (property)", () => {
      for (let i = 0; i < 200; i++) {
        const a = randomBytesSecure(randomIntSecure(0, 64));
        const b = Math.random() < 0.5 ? Buffer.from(a) : randomBytesSecure(randomIntSecure(0, 64));
        expect(safeEqual(a, b)).toBe(a.equals(b));
      }
    });
  });
});
