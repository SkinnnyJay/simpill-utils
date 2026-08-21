/**
 * @file Redaction Unit Tests
 */

import { DEFAULT_REDACT_PATHS, REDACT_DEFAULTS } from "../../../src/shared/constants";
import {
  createDefaultRedactor,
  createRedactor,
  mergeRedactPaths,
  parseRedactPath,
} from "../../../src/shared/redact";

describe("parseRedactPath", () => {
  it("parses dot notation", () => {
    expect(parseRedactPath("a.b.c")).toEqual(["a", "b", "c"]);
  });

  it("parses bracket notation with quotes", () => {
    expect(parseRedactPath("headers['set-cookie']")).toEqual(["headers", "set-cookie"]);
    expect(parseRedactPath('a["b.c"].d')).toEqual(["a", "b.c", "d"]);
  });

  it("parses array wildcard [*]", () => {
    expect(parseRedactPath("users[*].password")).toEqual(["users", "*", "password"]);
  });

  it("parses numeric indices", () => {
    expect(parseRedactPath("items[0].secret")).toEqual(["items", "0", "secret"]);
  });

  it("throws on malformed paths at creation time (not at log time)", () => {
    expect(() => parseRedactPath("a[b")).toThrow(/unclosed bracket/);
    expect(() => parseRedactPath("")).toThrow(/empty/);
    expect(() => createRedactor(["a["])).toThrow();
  });
});

describe("createRedactor", () => {
  it("redacts top-level keys", () => {
    const redact = createRedactor(["password"]);
    expect(redact({ password: "hunter2", user: "frank" })).toEqual({
      password: REDACT_DEFAULTS.CENSOR,
      user: "frank",
    });
  });

  it("redacts nested dot paths", () => {
    const redact = createRedactor(["user.token"]);
    expect(redact({ user: { token: "abc", name: "f" }, other: 1 })).toEqual({
      user: { token: "[REDACTED]", name: "f" },
      other: 1,
    });
  });

  it("redacts every array element via [*]", () => {
    const redact = createRedactor(["users[*].password"]);
    const input = {
      users: [
        { name: "a", password: "1" },
        { name: "b", password: "2" },
      ],
    };
    expect(redact(input)).toEqual({
      users: [
        { name: "a", password: "[REDACTED]" },
        { name: "b", password: "[REDACTED]" },
      ],
    });
  });

  it("redacts one level via intermediate * wildcard", () => {
    const redact = createRedactor(["*.secret"]);
    expect(redact({ a: { secret: "x", keep: 1 }, b: { secret: "y" }, c: 3 })).toEqual({
      a: { secret: "[REDACTED]", keep: 1 },
      b: { secret: "[REDACTED]" },
      c: 3,
    });
  });

  it("terminal .* redacts every key inside the parent", () => {
    const redact = createRedactor(["config.*"]);
    expect(redact({ config: { key: "k", token: "t" }, other: 1 })).toEqual({
      config: { key: "[REDACTED]", token: "[REDACTED]" },
      other: 1,
    });
  });

  it("supports numeric index paths", () => {
    const redact = createRedactor(["items[0].secret"]);
    expect(redact({ items: [{ secret: "s" }, { secret: "keep" }] })).toEqual({
      items: [{ secret: "[REDACTED]" }, { secret: "keep" }],
    });
  });

  it("supports a custom static censor", () => {
    const redact = createRedactor({ paths: ["password"], censor: "***" });
    expect(redact({ password: "x" })).toEqual({ password: "***" });
  });

  it("supports a censor function receiving value and path", () => {
    const redact = createRedactor({
      paths: ["user.token"],
      censor: (value, path) => `${String(value).slice(0, 2)}...@${path.join(".")}`,
    });
    expect(redact({ user: { token: "abcdef" } })).toEqual({
      user: { token: "ab...@user.token" },
    });
  });

  it("falls back to the default censor if the censor function throws", () => {
    const redact = createRedactor({
      paths: ["password"],
      censor: () => {
        throw new Error("boom");
      },
    });
    expect(redact({ password: "x" })).toEqual({ password: REDACT_DEFAULTS.CENSOR });
  });

  it("NEVER mutates the input", () => {
    const redact = createRedactor(["user.token", "list[*].secret"]);
    const input = {
      user: { token: "abc" },
      list: [{ secret: "s1" }],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    redact(input);
    expect(input).toEqual(snapshot);
  });

  it("shares references for untouched branches (selective clone)", () => {
    const redact = createRedactor(["secrets.password"]);
    const database = { host: "db", port: 5432 };
    const input = { database, secrets: { password: "x", salt: "s" } };
    const output = redact(input);
    expect(output.database).toBe(database); // untouched branch: same reference
    expect(output.secrets).not.toBe(input.secrets); // redacted branch: cloned
    expect(output.secrets.salt).toBe("s");
  });

  it("returns the SAME object when nothing matches (zero-copy)", () => {
    const redact = createRedactor(["password"]);
    const input = { user: "frank", n: 1 };
    expect(redact(input)).toBe(input);
  });

  it("passes primitives and null through unchanged", () => {
    const redact = createRedactor(["password"]);
    expect(redact(null as unknown as object)).toBe(null);
    expect(redact("str" as unknown as object)).toBe("str");
  });

  it("exact path and wildcard can both apply at the same level", () => {
    const redact = createRedactor(["a.exact", "a.*"]);
    expect(redact({ a: { exact: 1, other: 2 } })).toEqual({
      a: { exact: "[REDACTED]", other: "[REDACTED]" },
    });
  });
});

describe("mergeRedactPaths / createDefaultRedactor", () => {
  it("includes DEFAULT_REDACT_PATHS", () => {
    expect(mergeRedactPaths()).toEqual([...DEFAULT_REDACT_PATHS]);
  });

  it("appends extras without duplicating defaults", () => {
    expect(mergeRedactPaths(["password", "sessionId"])).toEqual([
      ...DEFAULT_REDACT_PATHS,
      "sessionId",
    ]);
  });

  it("createDefaultRedactor redacts password by default", () => {
    const redact = createDefaultRedactor();
    expect(redact({ password: "x", ok: 1 })).toEqual({
      password: REDACT_DEFAULTS.CENSOR,
      ok: 1,
    });
  });
});

describe("default redaction reaches nested and oddly-cased keys", () => {
  it("censors sensitive keys at any depth, not just the top level", () => {
    const redact = createDefaultRedactor();

    const result = redact({
      password: "top",
      user: { password: "nested" },
      req: { headers: { cookie: "session=abc" } },
      keep: "visible",
    });

    expect(result).toEqual({
      password: "[REDACTED]",
      user: { password: "[REDACTED]" },
      req: { headers: { cookie: "[REDACTED]" } },
      keep: "visible",
    });
  });

  it("matches key names ignoring case and _/- separators", () => {
    const redact = createDefaultRedactor();

    expect(
      redact({ Authorization: "Bearer x", API_KEY: "a", "access-token": "t", apiKey: "b" })
    ).toEqual({
      Authorization: "[REDACTED]",
      API_KEY: "[REDACTED]",
      "access-token": "[REDACTED]",
      apiKey: "[REDACTED]",
    });
  });

  it("censors sensitive keys inside array elements", () => {
    const redact = createDefaultRedactor();

    expect(redact({ users: [{ name: "a", secret: "s1" }, { secret: "s2" }] })).toEqual({
      users: [{ name: "a", secret: "[REDACTED]" }, { secret: "[REDACTED]" }],
    });
  });

  it("terminates on cyclic metadata instead of recursing forever", () => {
    const redact = createDefaultRedactor();
    const node: Record<string, unknown> = { token: "t" };
    node.self = node;

    const result = redact(node) as Record<string, unknown>;

    expect(result.token).toBe("[REDACTED]");
  });

  it("redacts a value reachable twice in both places (shared ref, not a cycle)", () => {
    const redact = createDefaultRedactor();
    const shared = { secret: "s" };

    const result = redact({ a: shared, b: shared }) as Record<string, Record<string, unknown>>;

    expect(result.a?.secret).toBe("[REDACTED]");
    expect(result.b?.secret).toBe("[REDACTED]");
  });

  it("never mutates the caller's object", () => {
    const redact = createDefaultRedactor();
    const input = { user: { password: "nested" } };

    redact(input);

    expect(input.user.password).toBe("nested");
  });

  it("still honours explicit pino-style paths alongside key matching", () => {
    const redact = createDefaultRedactor(["custom.field"]);

    expect(redact({ custom: { field: "x", other: "y" }, field: "top" })).toEqual({
      custom: { field: "[REDACTED]", other: "y" },
      field: "top",
    });
  });
});
