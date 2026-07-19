/**
 * Schema-validated environment parsing (envalid/znv style), zero deps.
 *
 * `EnvSpec`/`EnvSpecEntry` shipped in v1 as types only — nothing consumed
 * them. `createEnv` implements them: declare every variable in one place,
 * get a fully typed, frozen object back, and get EVERY missing/invalid
 * variable reported in a single aggregate error (not just the first),
 * with secret values redacted from the report.
 *
 * Edge-safe: reads a plain record (default `process.env`), no fs/dotenv.
 */

import { ENV_ERROR_CODE, EnvSchemaError, type EnvSchemaIssue } from "./errors";
import { redactEnvValue } from "./redact";

interface BaseSpecFields {
  /**
   * A variable is required unless it has a `default` or `required: false`.
   * Empty string counts as unset (standard dotenv semantics).
   */
  readonly required?: boolean;
  /** Shown in the aggregate error to make it executable documentation. */
  readonly description?: string;
  /** Force redaction of this key's value in errors regardless of name. */
  readonly secret?: boolean;
}

export interface EnvStringSpec extends BaseSpecFields {
  readonly type: "string";
  readonly default?: string;
  readonly choices?: readonly string[];
  readonly pattern?: RegExp;
  readonly validate?: (value: string) => boolean | string;
}

export interface EnvNumberSpec extends BaseSpecFields {
  readonly type: "number";
  readonly default?: number;
  readonly min?: number;
  readonly max?: number;
  readonly validate?: (value: number) => boolean | string;
}

export interface EnvIntegerSpec extends BaseSpecFields {
  readonly type: "integer";
  readonly default?: number;
  readonly min?: number;
  readonly max?: number;
  readonly validate?: (value: number) => boolean | string;
}

export interface EnvBooleanSpec extends BaseSpecFields {
  readonly type: "boolean";
  readonly default?: boolean;
}

export interface EnvEnumSpec<V extends string = string> extends BaseSpecFields {
  readonly type: "enum";
  readonly values: readonly V[];
  readonly default?: V;
  readonly caseInsensitive?: boolean;
}

/** Integer in [1, 65535]. Catches the `PORT= ` -> 0 class outright. */
export interface EnvPortSpec extends BaseSpecFields {
  readonly type: "port";
  readonly default?: number;
}

export interface EnvUrlSpec extends BaseSpecFields {
  readonly type: "url";
  readonly default?: string;
  /** Allowed protocols including colon, e.g. ["https:", "postgres:"]. */
  readonly protocols?: readonly string[];
}

export interface EnvJsonSpec extends BaseSpecFields {
  readonly type: "json";
  readonly default?: unknown;
}

export interface EnvArraySpec extends BaseSpecFields {
  readonly type: "array";
  readonly default?: readonly string[];
  readonly separator?: string;
}

/**
 * One entry per variable. The original v1 union
 * ({type:"string"|"number"|"boolean"; default?}) remains assignable.
 */
export type EnvSpecEntry =
  | EnvStringSpec
  | EnvNumberSpec
  | EnvIntegerSpec
  | EnvBooleanSpec
  // biome-ignore lint/suspicious/noExplicitAny: variance sink for generic enum specs
  | EnvEnumSpec<any>
  | EnvPortSpec
  | EnvUrlSpec
  | EnvJsonSpec
  | EnvArraySpec;

export type EnvSpec = Record<string, EnvSpecEntry>;

type SpecValue<E> = E extends { readonly type: "string" | "url" }
  ? string
  : E extends { readonly type: "number" | "integer" | "port" }
    ? number
    : E extends { readonly type: "boolean" }
      ? boolean
      : E extends { readonly type: "enum"; readonly values: readonly (infer V extends string)[] }
        ? V
        : E extends { readonly type: "json" }
          ? unknown
          : E extends { readonly type: "array" }
            ? string[]
            : never;

type IsOptional<E> = E extends { readonly default: NonNullable<unknown> }
  ? false
  : E extends { readonly required: false }
    ? true
    : false;

/** Fully inferred output type for a spec, including optionality. */
export type InferEnvSpec<S extends EnvSpec> = {
  readonly [K in keyof S as IsOptional<S[K]> extends true ? never : K]: SpecValue<S[K]>;
} & {
  readonly [K in keyof S as IsOptional<S[K]> extends true ? K : never]?: SpecValue<S[K]>;
};

export type EnvSource = Readonly<Record<string, string | undefined>>;

export interface CreateEnvOptions {
  /** Variable source. Defaults to process.env when available. */
  readonly source?: EnvSource;
  /** Redact ALL values in the report, not only secret-like keys. */
  readonly redactAll?: boolean;
  /**
   * Called with the issues instead of throwing when provided
   * (envalid `reporter` escape hatch). Return value ignored.
   */
  readonly reporter?: (issues: readonly EnvSchemaIssue[]) => void;
}

const TRUTHY = new Set(["true", "1"]);
const FALSY = new Set(["false", "0"]);
const PORT_MIN = 1;
const PORT_MAX = 65535;

function defaultSource(): EnvSource {
  // Edge/worker-safe: some runtimes have no `process` global at all.
  return typeof process !== "undefined" && process.env ? process.env : {};
}

interface ParseOutcome {
  ok: boolean;
  value?: unknown;
  reason?: string;
}

function parseEntry(entry: EnvSpecEntry, raw: string): ParseOutcome {
  switch (entry.type) {
    case "string": {
      if (entry.choices && !entry.choices.includes(raw)) {
        return { ok: false, reason: `must be one of: ${entry.choices.join(", ")}` };
      }
      if (entry.pattern && !entry.pattern.test(raw)) {
        return { ok: false, reason: `must match ${entry.pattern}` };
      }
      return runValidate(entry.validate, raw);
    }
    case "number":
    case "integer":
    case "port": {
      const parsed = Number(raw);
      if (raw.trim() === "" || Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        return { ok: false, reason: `must be a finite number` };
      }
      if (entry.type !== "number" && !Number.isInteger(parsed)) {
        return { ok: false, reason: `must be an integer` };
      }
      if (entry.type === "port" && (parsed < PORT_MIN || parsed > PORT_MAX)) {
        return { ok: false, reason: `must be a port in [${PORT_MIN}, ${PORT_MAX}]` };
      }
      if (entry.type !== "port") {
        if (entry.min !== undefined && parsed < entry.min) {
          return { ok: false, reason: `must be >= ${entry.min}` };
        }
        if (entry.max !== undefined && parsed > entry.max) {
          return { ok: false, reason: `must be <= ${entry.max}` };
        }
        return runValidate(entry.validate, parsed);
      }
      return { ok: true, value: parsed };
    }
    case "boolean": {
      const normalized = raw.trim().toLowerCase();
      if (TRUTHY.has(normalized)) {
        return { ok: true, value: true };
      }
      if (FALSY.has(normalized)) {
        return { ok: true, value: false };
      }
      return { ok: false, reason: `must be one of: true, false, 1, 0` };
    }
    case "enum": {
      const values: readonly string[] = entry.values;
      const match = entry.caseInsensitive
        ? values.find((v) => v.toLowerCase() === raw.toLowerCase())
        : values.find((v) => v === raw);
      if (match === undefined) {
        return { ok: false, reason: `must be one of: ${values.join(", ")}` };
      }
      return { ok: true, value: match };
    }
    case "url": {
      let url: URL;
      try {
        url = new URL(raw);
      } catch {
        return { ok: false, reason: `must be a valid URL` };
      }
      if (entry.protocols && !entry.protocols.includes(url.protocol)) {
        return { ok: false, reason: `protocol must be one of: ${entry.protocols.join(", ")}` };
      }
      return { ok: true, value: raw };
    }
    case "json": {
      try {
        return { ok: true, value: JSON.parse(raw) };
      } catch {
        return { ok: false, reason: `must be valid JSON` };
      }
    }
    case "array": {
      const separator = entry.separator ?? ",";
      const value = raw
        .split(separator)
        .map((part) => part.trim())
        .filter((part) => part !== "");
      return { ok: true, value };
    }
  }
}

function runValidate<T extends string | number>(
  validate: ((value: T) => boolean | string) | undefined,
  value: T
): ParseOutcome {
  if (!validate) {
    return { ok: true, value };
  }
  const result = validate(value);
  if (result === true) {
    return { ok: true, value };
  }
  return { ok: false, reason: typeof result === "string" ? result : "failed custom validation" };
}

/**
 * Validate `source` against `spec`; return a frozen, fully typed object.
 *
 * @throws {EnvSchemaError} listing EVERY issue at once, secret-redacted.
 * Frozen plain object output — immutable like envalid's, without the Proxy
 * wrapper envalid's own README flags as surprising (breaks structuredClone).
 */
export function createEnv<const S extends EnvSpec>(
  spec: S,
  options?: CreateEnvOptions
): InferEnvSpec<S> {
  const source = options?.source ?? defaultSource();
  const issues: EnvSchemaIssue[] = [];
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(spec)) {
    const raw = source[key];
    const redact = { always: options?.redactAll || entry.secret === true };

    if (raw === undefined || raw === "") {
      if (entry.default !== undefined) {
        output[key] = entry.default;
        continue;
      }
      if (entry.required === false) {
        continue;
      }
      const hint = entry.description ? ` — ${entry.description}` : "";
      issues.push({
        key,
        code: ENV_ERROR_CODE.ENV_MISSING,
        message: `required but not set (type: ${entry.type})${hint}`,
      });
      continue;
    }

    const outcome = parseEntry(entry, raw);
    if (!outcome.ok) {
      const received = String(redactEnvValue(key, raw, redact));
      issues.push({
        key,
        code: ENV_ERROR_CODE.ENV_VALIDATION,
        message: `${outcome.reason} (got "${received}")`,
        received,
      });
      continue;
    }
    output[key] = outcome.value;
  }

  if (issues.length > 0) {
    if (options?.reporter) {
      options.reporter(issues);
    } else {
      throw new EnvSchemaError(issues);
    }
  }

  return Object.freeze(output) as InferEnvSpec<S>;
}
