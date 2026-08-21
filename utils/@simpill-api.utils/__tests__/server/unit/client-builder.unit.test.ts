/**
 * @file Client Builder Unit Tests
 * @description Tests for substitutePath encoding, buildQuery arrays, header
 * merging/Content-Type override, typed errors, JSON handling, transform,
 * validateRequest, and duplicate route detection.
 */

import { z } from "zod";
import { createApiFactory } from "../../../src/server/api-factory";
import { buildQuery, mergeHeaders, substitutePath } from "../../../src/server/client-builder";
import {
  ApiDuplicateRouteError,
  ApiHttpError,
  ApiMissingParamError,
  ApiResponseParseError,
} from "../../../src/shared/errors";

const okJson = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });

describe("substitutePath", () => {
  it("should percent-encode param values", () => {
    expect(substitutePath("/users/:id", { id: "john doe" })).toBe("/users/john%20doe");
    expect(substitutePath("/files/:name", { name: "a/b" })).toBe("/files/a%2Fb");
    expect(substitutePath("/q/:v", { v: "x?y=1&z=2" })).toBe("/q/x%3Fy%3D1%26z%3D2");
  });

  it("should throw ApiMissingParamError instead of sending a literal :param", () => {
    // v1 produced "/users/:id" and sent it to the server.
    expect(() => substitutePath("/users/:id", {})).toThrow(ApiMissingParamError);
    try {
      substitutePath("/users/:id", {});
    } catch (err) {
      expect((err as ApiMissingParamError).param).toBe("id");
      expect((err as ApiMissingParamError).path).toBe("/users/:id");
    }
  });

  it("should substitute multiple params", () => {
    expect(substitutePath("/orgs/:org/repos/:repo", { org: "a", repo: "b" })).toBe(
      "/orgs/a/repos/b"
    );
  });
});

describe("buildQuery", () => {
  it("should serialize arrays as repeated keys", () => {
    expect(buildQuery({ tag: ["a", "b"], n: 1 })).toBe("?tag=a&tag=b&n=1");
  });

  it("should skip undefined and null entries at both levels", () => {
    expect(
      buildQuery({
        a: undefined as unknown as string,
        b: null as unknown as string,
        c: ["x", undefined as unknown as string, "y"],
      })
    ).toBe("?c=x&c=y");
  });

  it("should return empty string for empty query", () => {
    expect(buildQuery({})).toBe("");
  });

  it("should encode keys and values", () => {
    expect(buildQuery({ "a b": "c&d" })).toBe("?a%20b=c%26d");
  });
});

describe("mergeHeaders", () => {
  it("should merge later maps over earlier ones", () => {
    expect(mergeHeaders({ a: "1" }, { a: "2", b: "3" })).toEqual({ a: "2", b: "3" });
  });

  it("should collapse case-variant duplicates to the later key", () => {
    // v1 kept both "Content-Type" and "content-type" as distinct object keys
    // -> duplicate headers on the wire.
    expect(
      mergeHeaders({ "Content-Type": "application/json" }, { "content-type": "text/csv" })
    ).toEqual({ "content-type": "text/csv" });
  });
});

describe("client Content-Type handling", () => {
  it("should let per-call headers override Content-Type (README claimed this; v1 made it impossible)", async () => {
    let captured: Record<string, string> | undefined;
    const api = createApiFactory()
      .route("/upload", "upload")
      .post({ response: z.object({}) });
    const client = api.client({
      fetcher: async (_url, init) => {
        captured = init?.headers as Record<string, string>;
        return okJson({});
      },
    });
    await client.upload({ body: { x: 1 }, headers: { "Content-Type": "application/xml" } });
    expect(captured?.["Content-Type"]).toBe("application/xml");
    const values = Object.entries(captured ?? {}).filter(
      ([k]) => k.toLowerCase() === "content-type"
    );
    expect(values).toHaveLength(1);
  });

  it("should honor lowercase content-type without duplicating the header", async () => {
    let captured: Record<string, string> | undefined;
    const api = createApiFactory()
      .route("/upload", "upload")
      .post({ response: z.object({}) });
    const client = api.client({
      fetcher: async (_url, init) => {
        captured = init?.headers as Record<string, string>;
        return okJson({});
      },
    });
    await client.upload({ body: { x: 1 }, headers: { "content-type": "text/plain" } });
    const ctEntries = Object.entries(captured ?? {}).filter(
      ([k]) => k.toLowerCase() === "content-type"
    );
    expect(ctEntries).toEqual([["content-type", "text/plain"]]);
  });

  it("should default Content-Type to application/json when not supplied (v1 behavior)", async () => {
    let captured: Record<string, string> | undefined;
    const api = createApiFactory()
      .route("/x", "x")
      .post({ response: z.object({}) });
    const client = api.client({
      fetcher: async (_url, init) => {
        captured = init?.headers as Record<string, string>;
        return okJson({});
      },
    });
    await client.x({ body: {} });
    expect(captured?.["Content-Type"]).toBe("application/json");
  });
});

describe("client error typing", () => {
  it("should throw ApiHttpError with status/body/url/method and v1-compatible message", async () => {
    const api = createApiFactory({ baseUrl: "https://api.example.com" })
      .route("/fail", "fail")
      .get({ response: z.object({}) });
    const client = api.client({
      fetcher: async () => new Response("boom", { status: 503, statusText: "Service Unavailable" }),
    });
    const err = await client.fail().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiHttpError);
    const httpErr = err as ApiHttpError;
    expect(httpErr.message).toBe("HTTP 503: boom"); // byte-compatible with v1
    expect(httpErr.status).toBe(503);
    expect(httpErr.statusText).toBe("Service Unavailable");
    expect(httpErr.body).toBe("boom");
    expect(httpErr.url).toBe("https://api.example.com/fail");
    expect(httpErr.method).toBe("GET");
    expect(httpErr.routeKey).toBe("fail");
  });
});

describe("client JSON handling", () => {
  it("should throw ApiResponseParseError on non-empty invalid JSON (v1 silently coerced to {})", async () => {
    const api = createApiFactory().route("/bad", "bad").get({});
    const client = api.client({
      fetcher: async () => new Response("<html>gateway error</html>", { status: 200 }),
    });
    const err = await client.bad().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiResponseParseError);
    expect((err as ApiResponseParseError).bodySnippet).toContain("<html>");
  });

  it("should keep parsing empty bodies to {} (v1 compat for 204s)", async () => {
    const api = createApiFactory()
      .route("/empty", "empty")
      .delete({ response: z.object({}) });
    const client = api.client({
      fetcher: async () => new Response(null, { status: 204 }),
    });
    await expect(client.empty()).resolves.toEqual({});
  });
});

describe("route transform", () => {
  it("should apply transform to the parsed response (declared in v1 types but never settable)", async () => {
    const api = createApiFactory()
      .route("/user", "user")
      .get({
        response: z.object({ id: z.string(), name: z.string() }),
        transform: (data: { id: string; name: string }) => data.name.toUpperCase(),
      });
    const client = api.client({
      fetcher: async () => okJson({ id: "1", name: "alice" }),
    });
    const result = await client.user();
    expect(result).toBe("ALICE");
  });
});

describe("validateRequest", () => {
  it("should reject invalid request bodies client-side when enabled", async () => {
    const fetcher = jest.fn(async () => okJson({}));
    const api = createApiFactory()
      .route("/users", "createUser")
      .post({ body: z.object({ name: z.string() }), response: z.object({}) });
    const client = api.client({ fetcher, validateRequest: true });
    await expect(client.createUser({ body: { name: 123 as unknown as string } })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should not validate requests by default (v1 compat)", async () => {
    const fetcher = jest.fn(async () => okJson({}));
    const api = createApiFactory()
      .route("/users", "createUser")
      .post({ body: z.object({ name: z.string() }), response: z.object({}) });
    const client = api.client({ fetcher });
    await expect(client.createUser({ body: { name: 123 as unknown as string } })).resolves.toEqual(
      {}
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("duplicate route keys", () => {
  it("should throw ApiDuplicateRouteError instead of silently overwriting (v1 last-wins)", () => {
    expect(() => createApiFactory().route("/a", "dup").get({}).route("/b", "dup").get({})).toThrow(
      ApiDuplicateRouteError
    );
  });
});
