/**
 * @file Handler Builder Unit Tests
 * @description Path param decoding and repeated-query-array behavior.
 */

import { z } from "zod";
import { createApiFactory } from "../../../src/server/api-factory";
import {
  parsePathParams,
  parsePathParamsStrict,
  parseQuery,
} from "../../../src/server/handler-builder";
import { ApiRouteMismatchError } from "../../../src/shared/errors";

describe("parsePathParams", () => {
  it("should percent-decode path segments (round-trips what the client encodes)", () => {
    expect(parsePathParams("/users/:id", "/users/john%20doe")).toEqual({ id: "john doe" });
    expect(parsePathParams("/files/:name", "/files/a%2Fb")).toEqual({ name: "a/b" });
  });

  it("should keep raw value on malformed percent-encoding instead of throwing", () => {
    expect(parsePathParams("/users/:id", "/users/50%-off")).toEqual({ id: "50%-off" });
  });

  it("should keep plain segments untouched", () => {
    expect(parsePathParams("/users/:id", "/users/abc")).toEqual({ id: "abc" });
  });

  it("should silently under-match on segment-count mismatch (documents the gap parsePathParamsStrict closes)", () => {
    expect(parsePathParams("/users/:id/posts/:postId", "/users/abc")).toEqual({ id: "abc" });
  });
});

describe("parsePathParamsStrict", () => {
  it("should behave like parsePathParams when the URL matches the pattern", () => {
    expect(parsePathParamsStrict("/users/:id", "/users/john%20doe")).toEqual({ id: "john doe" });
    expect(parsePathParamsStrict("/users/:id/posts/:postId", "/users/1/posts/2")).toEqual({
      id: "1",
      postId: "2",
    });
  });

  it("should throw ApiRouteMismatchError on a segment-count mismatch", () => {
    expect(() => parsePathParamsStrict("/users/:id/posts/:postId", "/users/abc")).toThrow(
      ApiRouteMismatchError
    );
  });

  it("should throw ApiRouteMismatchError when a static segment differs", () => {
    expect(() => parsePathParamsStrict("/users/:id", "/accounts/abc")).toThrow(
      ApiRouteMismatchError
    );
  });

  it("should carry the pattern and path on the thrown error", () => {
    try {
      parsePathParamsStrict("/users/:id", "/accounts/abc");
      throw new Error("expected parsePathParamsStrict to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRouteMismatchError);
      expect((err as ApiRouteMismatchError).pathPattern).toBe("/users/:id");
      expect((err as ApiRouteMismatchError).path).toBe("/accounts/abc");
    }
  });
});

describe("parseQuery", () => {
  it("should collect repeated keys into arrays (v1 collapsed to the last value)", () => {
    const sp = new URLSearchParams("tag=a&tag=b&tag=c&single=x");
    expect(parseQuery(sp)).toEqual({ tag: ["a", "b", "c"], single: "x" });
  });

  it("should keep single-valued keys as plain strings (v1 compat)", () => {
    expect(parseQuery(new URLSearchParams("q=hello"))).toEqual({ q: "hello" });
  });
});

describe("handler integration", () => {
  it("should surface repeated query params to array schemas", async () => {
    const api = createApiFactory()
      .route("/search", "search")
      .get(
        {
          query: z.object({ tag: z.array(z.string()) }),
          response: z.object({ tags: z.array(z.string()) }),
        },
        (ctx) => ({ tags: ctx.query.tag })
      );
    const handlers = api.handlers();
    const result = await handlers.search({ url: "http://_/search?tag=a&tag=b", method: "GET" });
    expect(result).toEqual({ tags: ["a", "b"] });
  });

  it("should hand decoded path params to handlers", async () => {
    const api = createApiFactory()
      .route("/users/:id", "getUser")
      .get(
        { params: z.object({ id: z.string() }), response: z.object({ id: z.string() }) },
        (ctx) => ({ id: ctx.params.id })
      );
    const handlers = api.handlers();
    const result = await handlers.getUser({ url: "http://_/users/john%20doe", method: "GET" });
    expect(result).toEqual({ id: "john doe" });
  });
});
