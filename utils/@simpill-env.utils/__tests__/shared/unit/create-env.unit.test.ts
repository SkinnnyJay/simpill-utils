import { createEnv, type EnvSource } from "../../../src/shared/env-schema";
import { ENV_ERROR_CODE, EnvSchemaError, type EnvSchemaIssue } from "../../../src/shared/errors";
import { REDACTED_VALUE } from "../../../src/shared/redact";

const src = (record: Record<string, string>): EnvSource => record;

describe("createEnv — typed schema validation (implements the v1 EnvSpec that shipped as types only)", () => {
  it("parses a full schema into a typed object", () => {
    const env = createEnv(
      {
        PORT: { type: "port" },
        HOST: { type: "string", default: "0.0.0.0" },
        DEBUG: { type: "boolean", default: false },
        LOG_LEVEL: { type: "enum", values: ["debug", "info", "warn", "error"], default: "info" },
        MAX_RETRIES: { type: "integer", min: 0, max: 10 },
        RATE: { type: "number", min: 0 },
        API_URL: { type: "url" },
        FLAGS: { type: "json" },
        ORIGINS: { type: "array" },
      },
      {
        source: src({
          PORT: "8080",
          DEBUG: "1",
          LOG_LEVEL: "warn",
          MAX_RETRIES: "3",
          RATE: "1.5",
          API_URL: "https://api.example.com/v1",
          FLAGS: '{"beta":true}',
          ORIGINS: "a.com, b.com ,c.com",
        }),
      }
    );
    expect(env.PORT).toBe(8080);
    expect(env.HOST).toBe("0.0.0.0");
    expect(env.DEBUG).toBe(true);
    expect(env.LOG_LEVEL).toBe("warn");
    expect(env.MAX_RETRIES).toBe(3);
    expect(env.RATE).toBe(1.5);
    expect(env.API_URL).toBe("https://api.example.com/v1");
    expect(env.FLAGS).toEqual({ beta: true });
    expect(env.ORIGINS).toEqual(["a.com", "b.com", "c.com"]);
  });

  it("aggregates EVERY issue in one error instead of dying on the first", () => {
    let caught: EnvSchemaError | undefined;
    try {
      createEnv(
        {
          PORT: { type: "port" },
          API_URL: { type: "url" },
          LOG_LEVEL: { type: "enum", values: ["debug", "info"] },
          TIMEOUT_MS: { type: "integer" },
        },
        { source: src({ PORT: "99999", API_URL: "not a url", TIMEOUT_MS: "2.5" }) }
      );
    } catch (error) {
      caught = error as EnvSchemaError;
    }
    expect(caught).toBeInstanceOf(EnvSchemaError);
    const issues = caught?.issues as readonly EnvSchemaIssue[];
    expect(issues).toHaveLength(4);
    const byKey = Object.fromEntries(issues.map((i) => [i.key, i]));
    expect(byKey.PORT.code).toBe(ENV_ERROR_CODE.ENV_VALIDATION);
    expect(byKey.PORT.message).toContain("port");
    expect(byKey.API_URL.message).toContain("valid URL");
    expect(byKey.LOG_LEVEL.code).toBe(ENV_ERROR_CODE.ENV_MISSING);
    expect(byKey.TIMEOUT_MS.message).toContain("integer");
    // One report line per issue in the top-level message
    expect(caught?.message).toContain("4 issues");
    expect(caught?.message).toContain("PORT");
    expect(caught?.message).toContain("TIMEOUT_MS");
    expect(caught?.code).toBe(ENV_ERROR_CODE.ENV_SCHEMA);
  });

  it("port catches the `PORT= ` -> 0 class: whitespace, zero, floats, out-of-range", () => {
    for (const bad of [" ", "0", "3000.5", "65536", "-1", "banana", "Infinity"]) {
      expect(() => createEnv({ PORT: { type: "port" } }, { source: src({ PORT: bad }) })).toThrow(
        EnvSchemaError
      );
    }
    const env = createEnv({ PORT: { type: "port" } }, { source: src({ PORT: "65535" }) });
    expect(env.PORT).toBe(65535);
  });

  it("empty string counts as unset (dotenv semantics): default applies, required fails", () => {
    const env = createEnv(
      { HOST: { type: "string", default: "localhost" } },
      { source: src({ HOST: "" }) }
    );
    expect(env.HOST).toBe("localhost");
    expect(() => createEnv({ HOST: { type: "string" } }, { source: src({ HOST: "" }) })).toThrow(
      EnvSchemaError
    );
  });

  it("required:false yields undefined without an issue", () => {
    const env = createEnv(
      { OPTIONAL_FLAG: { type: "boolean", required: false } },
      { source: src({}) }
    );
    expect(env.OPTIONAL_FLAG).toBeUndefined();
  });

  it("string choices/pattern/custom validate all report with reasons", () => {
    expect(() =>
      createEnv(
        { REGION: { type: "string", choices: ["us", "eu"] } },
        { source: src({ REGION: "mars" }) }
      )
    ).toThrow(/one of: us, eu/);
    expect(() =>
      createEnv(
        { SLUG: { type: "string", pattern: /^[a-z-]+$/ } },
        { source: src({ SLUG: "Nope!" }) }
      )
    ).toThrow(/must match/);
    expect(() =>
      createEnv(
        { NAME: { type: "string", validate: (v) => v.length > 2 || "too short" } },
        { source: src({ NAME: "ab" }) }
      )
    ).toThrow(/too short/);
  });

  it("enum caseInsensitive returns the CANONICAL value", () => {
    const env = createEnv(
      { LOG_LEVEL: { type: "enum", values: ["debug", "info"], caseInsensitive: true } },
      { source: src({ LOG_LEVEL: "INFO" }) }
    );
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("url protocol allowlist enforced", () => {
    expect(() =>
      createEnv(
        { WEBHOOK: { type: "url", protocols: ["https:"] } },
        { source: src({ WEBHOOK: "http://insecure.example.com" }) }
      )
    ).toThrow(/protocol must be one of: https:/);
  });

  it("boolean is strict per package policy: yes/no/banana are issues, not defaults", () => {
    // BOOLEAN_PARSING_DOCS: only true/false/1/0. In schema mode a bad flag
    // must FAIL LOUDLY, not silently pick a side.
    for (const bad of ["yes", "no", "banana"]) {
      expect(() =>
        createEnv({ DEBUG: { type: "boolean" } }, { source: src({ DEBUG: bad }) })
      ).toThrow(EnvSchemaError);
    }
    expect(
      createEnv({ DEBUG: { type: "boolean" } }, { source: src({ DEBUG: " TRUE " }) }).DEBUG
    ).toBe(true);
  });

  it("redacts secret-like values in the report but shows non-secret ones", () => {
    let caught: EnvSchemaError | undefined;
    try {
      createEnv(
        {
          STRIPE_SECRET_KEY: { type: "string", pattern: /^sk_/ },
          PORT: { type: "port" },
        },
        { source: src({ STRIPE_SECRET_KEY: "pk_live_oops_12345", PORT: "banana" }) }
      );
    } catch (error) {
      caught = error as EnvSchemaError;
    }
    expect(caught?.message).not.toContain("pk_live_oops_12345");
    expect(caught?.message).toContain(REDACTED_VALUE);
    expect(caught?.message).toContain("banana");
    const secretIssue = caught?.issues.find((i) => i.key === "STRIPE_SECRET_KEY");
    expect(secretIssue?.received).toBe(REDACTED_VALUE);
  });

  it("secret:true forces redaction for innocently named keys; redactAll hides everything", () => {
    expect(() =>
      createEnv(
        { LICENSE: { type: "string", pattern: /^L-/, secret: true } },
        { source: src({ LICENSE: "super-secret-license" }) }
      )
    ).toThrow(expect.objectContaining({ message: expect.not.stringContaining("super-secret") }));
    let caught: EnvSchemaError | undefined;
    try {
      createEnv({ PORT: { type: "port" } }, { source: src({ PORT: "99999" }), redactAll: true });
    } catch (error) {
      caught = error as EnvSchemaError;
    }
    expect(caught?.message).not.toContain("99999");
  });

  it("reporter option receives issues instead of throwing (envalid escape hatch)", () => {
    const seen: EnvSchemaIssue[][] = [];
    const env = createEnv(
      { PORT: { type: "port" } },
      { source: src({}), reporter: (issues) => seen.push([...issues]) }
    );
    expect(seen).toHaveLength(1);
    expect(seen[0][0].code).toBe(ENV_ERROR_CODE.ENV_MISSING);
    expect(env).toEqual({});
  });

  it("missing-variable message carries the description (executable documentation)", () => {
    expect(() =>
      createEnv(
        { DATABASE_URL: { type: "url", description: "primary Postgres DSN" } },
        { source: src({}) }
      )
    ).toThrow(/primary Postgres DSN/);
  });

  it("output is frozen (immutable like envalid, without its Proxy wrapper)", () => {
    const env = createEnv({ PORT: { type: "port", default: 3000 } }, { source: src({}) });
    expect(Object.isFrozen(env)).toBe(true);
    // and unlike envalid's Proxy output, structuredClone works
    expect(structuredClone(env)).toEqual({ PORT: 3000 });
  });

  it("reads process.env by default", () => {
    const key = "CREATE_ENV_DEFAULT_SOURCE_TEST";
    process.env[key] = "42";
    try {
      const env = createEnv({ [key]: { type: "integer" } });
      expect(env[key]).toBe(42);
    } finally {
      delete process.env[key];
    }
  });

  it("number rejects Infinity and NaN in schema mode", () => {
    for (const bad of ["Infinity", "-Infinity", "NaN"]) {
      expect(() => createEnv({ RATE: { type: "number" } }, { source: src({ RATE: bad }) })).toThrow(
        /finite/
      );
    }
  });

  it("array respects custom separator and trims entries", () => {
    const env = createEnv(
      { PATHS: { type: "array", separator: ";" } },
      { source: src({ PATHS: " /a ; /b ;; /c " }) }
    );
    expect(env.PATHS).toEqual(["/a", "/b", "/c"]);
  });

  it("v1 EnvSpecEntry shapes remain assignable (back-compat)", () => {
    const env = createEnv(
      {
        A: { type: "string", default: "x" },
        B: { type: "number", default: 7 },
        C: { type: "boolean", default: true },
      },
      { source: src({}) }
    );
    expect(env).toEqual({ A: "x", B: 7, C: true });
  });
});
