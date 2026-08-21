import { EnvParseError, EnvValidationError } from "../../../src/shared/errors";
import { REDACTED_VALUE } from "../../../src/shared/redact";

describe("error message secret redaction", () => {
  it("EnvParseError redacts secret-like keys in message AND stored rawValue", () => {
    const error = new EnvParseError("STRIPE_SECRET_KEY", "sk_live_51abcdef", "number");
    expect(error.message).not.toContain("sk_live_51abcdef");
    expect(error.message).toContain(REDACTED_VALUE);
    // The stored property must not carry the secret either — serialized
    // errors land in logs and crash reporters verbatim.
    expect(error.rawValue).toBe(REDACTED_VALUE);
  });

  it("EnvValidationError redacts secret-like keys", () => {
    const error = new EnvValidationError("DB_PASSWORD", "hunter2", "too short");
    expect(error.message).not.toContain("hunter2");
    expect(error.value).toBe(REDACTED_VALUE);
  });

  it("connection-string keys redact (DATABASE_URL)", () => {
    const error = new EnvParseError("DATABASE_URL", "postgres://admin:s3cr3t@db:5432/x", "number");
    expect(error.message).not.toContain("s3cr3t");
  });

  it("non-secret keys keep their raw values (back-compat)", () => {
    const parse = new EnvParseError("PORT", "not-a-number", "number");
    expect(parse.message).toContain('got "not-a-number"');
    expect(parse.rawValue).toBe("not-a-number");
    const validation = new EnvValidationError("API_URL", "not-a-url", "must be a valid URL");
    expect(validation.message).toContain('"not-a-url"');
    expect(validation.value).toBe("not-a-url");
  });
});
