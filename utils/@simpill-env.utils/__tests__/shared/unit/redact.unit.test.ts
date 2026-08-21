import {
  isSecretLikeKey,
  REDACTED_VALUE,
  redactEnvValue,
  SECRET_KEY_PATTERN,
} from "../../../src/shared/redact";

describe("isSecretLikeKey", () => {
  it("matches common secret key shapes", () => {
    for (const key of [
      "API_KEY",
      "APIKEY",
      "SECRET_KEY",
      "MY_TOKEN",
      "PGPASSWORD",
      "DB_PASSWD",
      "REDIS_PWD",
      "AWS_ACCESS_KEY_ID",
      "GITHUB_AUTH",
      "OAUTH_SECRET",
      "SIGNING_CERTIFICATE",
      "DATABASE_URL",
      "PG_DSN",
      "CONNECTION_STRING",
      "SESSION_COOKIE",
      "TLS_CERT",
      "PRIVATE_KEY",
      "SERVICE_CREDENTIALS",
    ]) {
      expect(isSecretLikeKey(key)).toBe(true);
    }
  });

  it("does NOT match ordinary config keys", () => {
    for (const key of [
      "PORT",
      "DEBUG",
      "ENABLED",
      "API_URL",
      "KEY", // bare KEY is ambiguous; only *_KEY redacts
      "KEY2",
      "AUTHOR", // AUTH must match as a segment, not a substring
      "LOG_LEVEL",
      "NODE_ENV",
      "MAX_RETRIES",
    ]) {
      expect(isSecretLikeKey(key)).toBe(false);
    }
  });

  it("is case-insensitive", () => {
    expect(isSecretLikeKey("api_key")).toBe(true);
    expect(SECRET_KEY_PATTERN.test("database_url")).toBe(true);
  });

  it("matches AUTHORIZATION and its variants", () => {
    // The docstring claimed AUTH coverage, but the anchor `(^|_)AUTH(_|$)` required AUTH to be
    // a whole underscore-delimited segment - so the most canonical secret-bearing name missed.
    for (const key of ["AUTHORIZATION", "authorization", "Authorization", "AUTHN", "AUTHZ"]) {
      expect(isSecretLikeKey(key)).toBe(true);
    }
  });

  it("matches PASSPHRASE alongside the PASSWORD family", () => {
    expect(isSecretLikeKey("PASSPHRASE")).toBe(true);
    expect(isSecretLikeKey("SSH_PASSPHRASE")).toBe(true);
  });

  it("still excludes the deliberately-unmatched generic names", () => {
    for (const key of ["PORT", "KEY", "HOST", "NODE_ENV"]) {
      expect(isSecretLikeKey(key)).toBe(false);
    }
  });
});

describe("redactEnvValue", () => {
  it("redacts values for secret-like keys", () => {
    expect(redactEnvValue("API_KEY", "sk-live-abc123")).toBe(REDACTED_VALUE);
    expect(redactEnvValue("DATABASE_URL", "postgres://u:pw@host/db")).toBe(REDACTED_VALUE);
  });

  it("passes non-secret values through", () => {
    expect(redactEnvValue("PORT", "3000")).toBe("3000");
    expect(redactEnvValue("PORT", 99999)).toBe(99999);
    expect(redactEnvValue("ENABLED", false)).toBe(false);
  });

  it("redacts everything when always is set", () => {
    expect(redactEnvValue("PORT", "3000", { always: true })).toBe(REDACTED_VALUE);
  });

  it("truncates huge non-secret values instead of echoing them whole", () => {
    const huge = "x".repeat(5000);
    const shown = redactEnvValue("CONFIG_BLOB", huge) as string;
    expect(shown.length).toBeLessThan(300);
    expect(shown).toContain("5000 chars");
  });
});
