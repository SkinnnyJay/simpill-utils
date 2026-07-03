import * as clientExports from "../../../src/client";
import * as rootExports from "../../../src/index";
import * as serverExports from "../../../src/server";
import * as sharedExports from "../../../src/shared";
import {
  CORRELATION_HEADERS,
  CORRELATION_ID_PATTERN,
  type CorrelationHeaderName,
  ENV_BOOLEAN_PARSING,
  ENV_BOOLEAN_PARSING_EXTENDED,
  HTTP_METHOD,
  HTTP_METHOD_PROPERTIES,
  IDEMPOTENT_HTTP_METHODS,
  LOG_ENV_KEYS,
  LOG_FORMAT_VALUES,
  SAFE_HTTP_METHODS,
  TRACE_CONTEXT_HEADERS,
  TRACE_CONTEXT_VERSION,
  TRACEPARENT_PATTERN,
} from "../../../src/shared";

describe("protocols.utils uplift", () => {
  describe("HTTP_METHOD additions", () => {
    it("keeps the original five methods byte-identical", () => {
      expect(HTTP_METHOD.GET).toBe("GET");
      expect(HTTP_METHOD.POST).toBe("POST");
      expect(HTTP_METHOD.PUT).toBe("PUT");
      expect(HTTP_METHOD.PATCH).toBe("PATCH");
      expect(HTTP_METHOD.DELETE).toBe("DELETE");
    });

    it("adds HEAD, OPTIONS, and QUERY (RFC 10008)", () => {
      expect(HTTP_METHOD.HEAD).toBe("HEAD");
      expect(HTTP_METHOD.OPTIONS).toBe("OPTIONS");
      expect(HTTP_METHOD.QUERY).toBe("QUERY");
    });

    it("does not include proxy/diagnostic methods in the app-level set", () => {
      expect(Object.keys(HTTP_METHOD)).not.toContain("CONNECT");
      expect(Object.keys(HTTP_METHOD)).not.toContain("TRACE");
    });
  });

  describe("HTTP_METHOD_PROPERTIES (IANA registry columns)", () => {
    it("matches the IANA safe/idempotent registration for every method", () => {
      expect(HTTP_METHOD_PROPERTIES).toEqual({
        CONNECT: { safe: false, idempotent: false },
        DELETE: { safe: false, idempotent: true },
        GET: { safe: true, idempotent: true },
        HEAD: { safe: true, idempotent: true },
        OPTIONS: { safe: true, idempotent: true },
        PATCH: { safe: false, idempotent: false },
        POST: { safe: false, idempotent: false },
        PUT: { safe: false, idempotent: true },
        QUERY: { safe: true, idempotent: true },
        TRACE: { safe: true, idempotent: true },
      });
    });

    it("every safe method is idempotent (RFC 9110 invariant)", () => {
      for (const [method, props] of Object.entries(HTTP_METHOD_PROPERTIES)) {
        if (props.safe) {
          expect({ method, idempotent: props.idempotent }).toEqual({ method, idempotent: true });
        }
      }
    });

    it("covers every method in HTTP_METHOD", () => {
      for (const method of Object.values(HTTP_METHOD)) {
        expect(HTTP_METHOD_PROPERTIES).toHaveProperty(method);
      }
    });
  });

  describe("SAFE_HTTP_METHODS / IDEMPOTENT_HTTP_METHODS derivation", () => {
    it("SAFE tuple contains exactly the registry's safe methods", () => {
      const fromRegistry = Object.entries(HTTP_METHOD_PROPERTIES)
        .filter(([, p]) => p.safe)
        .map(([m]) => m)
        .sort();
      expect([...SAFE_HTTP_METHODS].sort()).toEqual(fromRegistry);
    });

    it("IDEMPOTENT tuple contains exactly the registry's idempotent methods", () => {
      const fromRegistry = Object.entries(HTTP_METHOD_PROPERTIES)
        .filter(([, p]) => p.idempotent)
        .map(([m]) => m)
        .sort();
      expect([...IDEMPOTENT_HTTP_METHODS].sort()).toEqual(fromRegistry);
    });

    it("safe is a subset of idempotent", () => {
      for (const m of SAFE_HTTP_METHODS) {
        expect(IDEMPOTENT_HTTP_METHODS).toContain(m);
      }
    });
  });

  describe("TRACE_CONTEXT_HEADERS (W3C Trace Context)", () => {
    it("exports lowercase traceparent and tracestate", () => {
      expect(TRACE_CONTEXT_HEADERS.TRACEPARENT).toBe("traceparent");
      expect(TRACE_CONTEXT_HEADERS.TRACESTATE).toBe("tracestate");
      expect(TRACE_CONTEXT_VERSION).toBe("00");
    });

    it("does NOT widen CorrelationHeaderName (nextjs keys Record off it)", () => {
      expect(Object.keys(CORRELATION_HEADERS)).toEqual(["REQUEST_ID", "TRACE_ID"]);
      // Compile-time guard: the union must stay exactly two members.
      const stillTwoMembers: Record<CorrelationHeaderName, string> = {
        "x-request-id": "a",
        "x-trace-id": "b",
      };
      expect(Object.keys(stillTwoMembers)).toHaveLength(2);
      // @ts-expect-error traceparent must not be a CorrelationHeaderName
      const widened: CorrelationHeaderName = "traceparent";
      expect(widened).toBe("traceparent");
    });
  });

  describe("TRACEPARENT_PATTERN", () => {
    const valid = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

    it("accepts the W3C spec example", () => {
      expect(TRACEPARENT_PATTERN.test(valid)).toBe(true);
      expect(TRACEPARENT_PATTERN.test(valid.replace(/01$/, "00"))).toBe(true);
    });

    it("rejects all-zero trace-id and all-zero parent-id (spec-invalid)", () => {
      expect(
        TRACEPARENT_PATTERN.test("00-00000000000000000000000000000000-b7ad6b7169203331-01")
      ).toBe(false);
      expect(
        TRACEPARENT_PATTERN.test("00-0af7651916cd43dd8448eb211c80319c-0000000000000000-01")
      ).toBe(false);
    });

    it("rejects uppercase hex, wrong lengths, and non-00 versions", () => {
      expect(TRACEPARENT_PATTERN.test(valid.toUpperCase())).toBe(false);
      expect(
        TRACEPARENT_PATTERN.test("00-0af7651916cd43dd8448eb211c80319-b7ad6b7169203331-01")
      ).toBe(false);
      expect(
        TRACEPARENT_PATTERN.test("00-0af7651916cd43dd8448eb211c80319c-b7ad6b716920333-01")
      ).toBe(false);
      expect(TRACEPARENT_PATTERN.test(valid.replace(/^00/, "ff"))).toBe(false);
      expect(TRACEPARENT_PATTERN.test(valid.replace(/^00/, "01"))).toBe(false);
      expect(TRACEPARENT_PATTERN.test("")).toBe(false);
      expect(TRACEPARENT_PATTERN.test(`${valid}-extra`)).toBe(false);
    });
  });

  describe("CORRELATION_ID_PATTERN", () => {
    it("accepts UUIDs and typical ids up to 128 chars", () => {
      expect(CORRELATION_ID_PATTERN.test("0af76519-16cd-43dd-8448-eb211c80319c")).toBe(true);
      expect(CORRELATION_ID_PATTERN.test("req_1.2~3-x")).toBe(true);
      expect(CORRELATION_ID_PATTERN.test("a".repeat(128))).toBe(true);
    });

    it("rejects empty, oversized, and injection-shaped values", () => {
      expect(CORRELATION_ID_PATTERN.test("")).toBe(false);
      expect(CORRELATION_ID_PATTERN.test("a".repeat(129))).toBe(false);
      expect(CORRELATION_ID_PATTERN.test("x".repeat(16384))).toBe(false);
      expect(CORRELATION_ID_PATTERN.test("abc\ndef")).toBe(false);
      expect(CORRELATION_ID_PATTERN.test("abc def")).toBe(false);
      expect(CORRELATION_ID_PATTERN.test('abc"def')).toBe(false);
      expect(CORRELATION_ID_PATTERN.test("абв")).toBe(false);
    });
  });

  describe("ENV_BOOLEAN_PARSING_EXTENDED", () => {
    it("keeps the strict policy untouched", () => {
      expect(ENV_BOOLEAN_PARSING.TRUTHY).toEqual(["true", "1"]);
      expect(ENV_BOOLEAN_PARSING.FALSY).toEqual(["false", "0"]);
    });

    it("exports the yn-convention sets", () => {
      expect(ENV_BOOLEAN_PARSING_EXTENDED.TRUTHY).toEqual(["true", "1", "yes", "y", "on"]);
      expect(ENV_BOOLEAN_PARSING_EXTENDED.FALSY).toEqual(["false", "0", "no", "n", "off"]);
    });

    it("truthy and falsy sets never overlap and are all lowercase", () => {
      for (const parsing of [ENV_BOOLEAN_PARSING, ENV_BOOLEAN_PARSING_EXTENDED]) {
        const truthy = new Set<string>(parsing.TRUTHY);
        for (const v of parsing.FALSY) {
          expect(truthy.has(v)).toBe(false);
        }
        for (const v of [...parsing.TRUTHY, ...parsing.FALSY]) {
          expect(v).toBe(v.toLowerCase());
        }
      }
    });
  });

  describe("runtime immutability (source-of-truth constants are frozen)", () => {
    const frozenObjects: Array<[string, object]> = [
      ["HTTP_METHOD", HTTP_METHOD],
      ["HTTP_METHOD_PROPERTIES", HTTP_METHOD_PROPERTIES],
      ["HTTP_METHOD_PROPERTIES.GET", HTTP_METHOD_PROPERTIES.GET],
      ["SAFE_HTTP_METHODS", SAFE_HTTP_METHODS],
      ["IDEMPOTENT_HTTP_METHODS", IDEMPOTENT_HTTP_METHODS],
      ["CORRELATION_HEADERS", CORRELATION_HEADERS],
      ["TRACE_CONTEXT_HEADERS", TRACE_CONTEXT_HEADERS],
      ["ENV_BOOLEAN_PARSING", ENV_BOOLEAN_PARSING],
      ["ENV_BOOLEAN_PARSING.TRUTHY", ENV_BOOLEAN_PARSING.TRUTHY],
      ["ENV_BOOLEAN_PARSING_EXTENDED", ENV_BOOLEAN_PARSING_EXTENDED],
      ["ENV_BOOLEAN_PARSING_EXTENDED.TRUTHY", ENV_BOOLEAN_PARSING_EXTENDED.TRUTHY],
      ["LOG_ENV_KEYS", LOG_ENV_KEYS],
      ["LOG_FORMAT_VALUES", LOG_FORMAT_VALUES],
    ];

    it.each(frozenObjects)("%s is frozen", (_name, obj) => {
      expect(Object.isFrozen(obj)).toBe(true);
    });

    it("mutation attempts throw in strict mode", () => {
      expect(() => {
        (HTTP_METHOD as Record<string, string>).GET = "HACKED";
      }).toThrow(TypeError);
      expect(() => {
        (ENV_BOOLEAN_PARSING.TRUTHY as unknown as string[]).push("maybe");
      }).toThrow(TypeError);
      expect(HTTP_METHOD.GET).toBe("GET");
      expect(ENV_BOOLEAN_PARSING.TRUTHY).toHaveLength(2);
    });
  });

  describe("subpath export parity", () => {
    it("root, client, server, and shared export identical surfaces", () => {
      const sharedKeys = Object.keys(sharedExports).sort();
      expect(Object.keys(rootExports).sort()).toEqual(sharedKeys);
      expect(Object.keys(clientExports).sort()).toEqual(sharedKeys);
      expect(Object.keys(serverExports).sort()).toEqual(sharedKeys);
    });
  });
});
