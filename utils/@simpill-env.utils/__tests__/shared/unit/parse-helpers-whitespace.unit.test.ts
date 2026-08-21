import { EnvParseError } from "../../../src/shared/errors";
import {
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
} from "../../../src/shared/parse-helpers";

describe("whitespace handling (Number(' ') === 0 bug class)", () => {
  it("lenient number: whitespace-only returns the default, not 0", () => {
    // Before: Number(" ") === 0, so `PORT= ` parsed to 0 instead of 8080.
    expect(parseNumberEnvValue(" ", 8080)).toBe(8080);
    expect(parseNumberEnvValue("\t", 8080)).toBe(8080);
    expect(parseNumberEnvValue("  \n ", 8080)).toBe(8080);
  });

  it("STRICT number: whitespace-only throws instead of returning 0", () => {
    // Before: strict mode returned 0 for " " — the one mode whose entire
    // contract is to throw on garbage.
    expect(() => parseNumberEnvValueStrict("PORT", " ")).toThrow(EnvParseError);
    expect(() => parseNumberEnvValueStrict("PORT", "\t\n")).toThrow(EnvParseError);
  });

  it("number: surrounding whitespace still parses (Number trims)", () => {
    expect(parseNumberEnvValue(" 42 ", 0)).toBe(42);
    expect(parseNumberEnvValueStrict("N", " 42 ")).toBe(42);
  });

  it("lenient boolean: trailing/leading whitespace no longer falls to default", () => {
    // Before: "true " !== "true" so a trailing space silently flipped the flag.
    expect(parseBooleanEnvValue("true ", false)).toBe(true);
    expect(parseBooleanEnvValue(" FALSE", true)).toBe(false);
    expect(parseBooleanEnvValue(" 1 ", false)).toBe(true);
  });

  it("strict boolean: trimmed values parse; whitespace-only throws", () => {
    expect(parseBooleanEnvValueStrict("DEBUG", "true ")).toBe(true);
    expect(parseBooleanEnvValueStrict("DEBUG", " 0")).toBe(false);
    expect(() => parseBooleanEnvValueStrict("DEBUG", "  ")).toThrow(EnvParseError);
  });
});
