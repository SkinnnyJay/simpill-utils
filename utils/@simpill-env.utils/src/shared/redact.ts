/**
 * Secret redaction for environment variable values.
 *
 * Env error messages that embed raw values are a secret-exfiltration path:
 * a malformed DATABASE_URL or API key thrown in an error lands verbatim in
 * logs, crash reporters, and monitoring pipelines. Values for secret-like
 * keys are replaced with a fixed placeholder instead.
 *
 * Edge-safe: no Node built-ins.
 */

/** Placeholder substituted for redacted values. */
export const REDACTED_VALUE = "[redacted]" as const;

/** Truncation threshold for non-secret values echoed into messages. */
const MAX_ECHOED_VALUE_LENGTH = 256;

/**
 * Key-name heuristic for secret-bearing environment variables.
 * Matches: SECRET, TOKEN, PASSWORD/PASSWD/PWD, CREDENTIAL, PRIVATE,
 * AUTH/AUTHN/AUTHZ/AUTHENTICATION/AUTHORIZATION, API_KEY/APIKEY/ACCESS_KEY, SIGNING,
 * *_KEY suffix, PASSPHRASE,
 * DSN, DATABASE_URL, CONNECTION_STRING, COOKIE, CERT segments.
 * Deliberately does NOT match bare "KEY", "PORT", or generic "*_URL".
 */
export const SECRET_KEY_PATTERN =
  /(SECRET|TOKEN|PASSW(OR)?D|PASSPHRASE|PWD|CREDENTIAL|PRIVATE|(^|_)AUTH(N|Z|ENTICATION|ORIZATION)?(_|$)|API_?KEY|ACCESS_?KEY|SIGNING|_KEY$|(^|_)DSN(_|$)|DATABASE_URL|CONNECTION_STRING|(^|_)COOKIE(_|$)|(^|_)CERT(_|$))/i;

/** True when the key name looks like it holds a secret. */
export function isSecretLikeKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

export interface RedactOptions {
  /** Redact regardless of key name. */
  readonly always?: boolean;
}

/**
 * Return a value safe to echo into an error message or report.
 * Secret-like keys (or `always: true`) yield REDACTED_VALUE; other string
 * values are truncated to a sane length; non-strings pass through.
 */
export function redactEnvValue(
  key: string,
  value: string | number | boolean,
  options?: RedactOptions
): string | number | boolean {
  if (options?.always || isSecretLikeKey(key)) {
    return REDACTED_VALUE;
  }
  if (typeof value === "string" && value.length > MAX_ECHOED_VALUE_LENGTH) {
    return `${value.slice(0, MAX_ECHOED_VALUE_LENGTH)}… (${value.length} chars)`;
  }
  return value;
}
