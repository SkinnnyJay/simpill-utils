describe("uuid", () => {
  const { generateUUID, validateUUID, isUUID } = require("../../../src/shared");

  it("generateUUID returns 36-char hyphenated string", () => {
    const u = generateUUID();
    expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("validateUUID accepts valid v4", () => {
    const u = generateUUID();
    expect(validateUUID(u)).toBe(true);
    expect(isUUID(u)).toBe(true);
  });

  it("validateUUID rejects invalid", () => {
    expect(validateUUID("not-a-uuid")).toBe(false);
    expect(validateUUID("")).toBe(false);
  });
});
