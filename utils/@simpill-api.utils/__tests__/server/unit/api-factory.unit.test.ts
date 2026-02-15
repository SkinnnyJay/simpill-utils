/**
 * @file API Factory Unit Tests
 * @description Tests for createApiFactory, route builder, client, handlers, validation, middleware
 */

import { z } from "zod";
import { createApiFactory } from "../../../src/server/api-factory";
import { HANDLER_ERROR, TIMEOUT_MS_5000 } from "../../../src/shared/internal-constants";

describe("createApiFactory", () => {
  describe("route builder", () => {
    it("should chain route().get() and route().post()", () => {
      const api = createApiFactory()
        .route("/users/:id")
        .get({
          params: z.object({ id: z.string() }),
          response: z.object({ id: z.string(), name: z.string() }),
        })
        .route("/users")
        .post({
          body: z.object({ name: z.string() }),
          response: z.object({ id: z.string(), name: z.string() }),
        });
      const client = api.client();
      expect(Object.keys(client)).toContain("GET:/users/:id");
      expect(Object.keys(client)).toContain("POST:/users");
    });

    it("should use custom route name when provided", () => {
      const api = createApiFactory()
        .route("/users/:id", "getUser")
        .get({ response: z.object({ id: z.string() }) });
      const client = api.client();
      expect(Object.keys(client)).toContain("getUser");
    });
  });

  describe("client", () => {
    it("should build URL with path params and query", async () => {
      let capturedUrl = "";
      const api = createApiFactory({ baseUrl: "https://api.example.com" })
        .route("/users/:id")
        .get({
          params: z.object({ id: z.string() }),
          query: z.object({ foo: z.string().optional() }),
          response: z.object({ id: z.string() }),
        });
      const client = api.client({
        fetcher: async (url) => {
          capturedUrl = typeof url === "string" ? url : url.toString();
          return new Response(JSON.stringify({ id: "123" }), { status: 200 });
        },
      });
      await client["GET:/users/:id"]({
        params: { id: "abc" },
        query: { foo: "bar" },
      });
      expect(capturedUrl).toContain("https://api.example.com/users/abc");
      expect(capturedUrl).toContain("foo=bar");
    });

    it("should parse response with Zod schema", async () => {
      const api = createApiFactory()
        .route("/me")
        .get({
          response: z.object({ id: z.string(), name: z.string() }),
        });
      const client = api.client({
        fetcher: async () =>
          new Response(JSON.stringify({ id: "1", name: "Alice" }), { status: 200 }),
      });
      const result = await client["GET:/me"]();
      expect(result).toEqual({ id: "1", name: "Alice" });
    });

    it("should send body for POST", async () => {
      let capturedBody: string | undefined;
      const api = createApiFactory()
        .route("/users")
        .post({
          body: z.object({ name: z.string() }),
          response: z.object({ id: z.string() }),
        });
      const client = api.client({
        fetcher: async (_url, init) => {
          capturedBody = init?.body as string;
          return new Response(JSON.stringify({ id: "1" }), { status: 200 });
        },
      });
      await client["POST:/users"]({ body: { name: "Jane" } });
      expect(JSON.parse(capturedBody ?? "{}")).toEqual({ name: "Jane" });
    });

    it("should merge default headers and request headers", async () => {
      let capturedHeaders: Record<string, string> | undefined;
      const api = createApiFactory({ defaultHeaders: { "X-App": "test" } })
        .route("/me")
        .get({ response: z.object({}) });
      const client = api.client({
        headers: { "X-Request": "r1" },
        fetcher: async (_url, init) => {
          capturedHeaders = init?.headers as Record<string, string> | undefined;
          return new Response("{}", { status: 200 });
        },
      });
      await client["GET:/me"]({ headers: { "X-Custom": "c1" } });
      const h = capturedHeaders ?? {};
      expect(h["X-App"]).toBe("test");
      expect(h["X-Request"]).toBe("r1");
      expect(h["X-Custom"]).toBe("c1");
    });

    it("should throw when response is not ok", async () => {
      const api = createApiFactory()
        .route("/fail")
        .get({ response: z.object({}) });
      const client = api.client({
        fetcher: async () => new Response("error", { status: 500 }),
      });
      await expect(client["GET:/fail"]()).rejects.toThrow("HTTP 500");
    });

    it("should use fetchWithTimeout when timeoutMs is set", async () => {
      const api = createApiFactory()
        .route("/slow")
        .get({ response: z.object({ ok: z.boolean() }) });
      const client = api.client({
        timeoutMs: TIMEOUT_MS_5000,
        fetcher: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      });
      const result = await client["GET:/slow"]();
      expect(result).toEqual({ ok: true });
    });

    it("should use fetchWithRetry when retry options are set", async () => {
      let attempts = 0;
      const api = createApiFactory()
        .route("/retry")
        .get({ response: z.object({ n: z.number() }) });
      const client = api.client({
        retry: { maxRetries: 2, delayMs: 1 },
        fetcher: async () => {
          attempts++;
          if (attempts < 2) throw new Error("fail");
          return new Response(JSON.stringify({ n: attempts }), { status: 200 });
        },
      });
      const result = await client["GET:/retry"]();
      expect(result).toEqual({ n: 2 });
      expect(attempts).toBe(2);
    });
  });

  describe("handlers", () => {
    it("should return only routes with handler", () => {
      const api = createApiFactory()
        .route("/users/:id", "getUser")
        .get(
          {
            params: z.object({ id: z.string() }),
            response: z.object({ id: z.string() }),
          },
          (ctx) => ({ id: (ctx.params as { id: string }).id })
        )
        .route("/no-handler")
        .get({ response: z.object({}) });
      const handlers = api.handlers();
      expect(Object.keys(handlers)).toContain("getUser");
      expect(Object.keys(handlers)).not.toContain("GET:/no-handler");
    });

    it("should parse params, query, body and call handler", async () => {
      const paramsSchema = z.object({ id: z.string() });
      const querySchema = z.object({ q: z.string().optional() });
      type Params = z.infer<typeof paramsSchema>;
      type Query = z.infer<typeof querySchema>;
      const api = createApiFactory()
        .route("/users/:id", "getUser")
        .get(
          {
            params: paramsSchema,
            query: querySchema,
            response: z.object({ id: z.string(), q: z.string().optional() }),
          },
          (ctx): { id: string; q?: string } => ({
            id: (ctx.params as Params).id,
            q: (ctx.query as Query).q,
          })
        );
      const handlers = api.handlers();
      const result = await handlers.getUser({
        url: "http://_/users/abc?q=hello",
        method: "GET",
      });
      expect(result).toEqual({ id: "abc", q: "hello" });
    });

    it("should run global before/after middleware", async () => {
      const order: string[] = [];
      const api = createApiFactory({
        middleware: {
          before: (ctx) => {
            order.push("global-before");
            return ctx;
          },
          after: (_ctx, result) => {
            order.push("global-after");
            return result;
          },
        },
      })
        .route("/m", "m")
        .get({ response: z.object({}) }, () => {
          order.push("handler");
          return {};
        });
      const handlers = api.handlers();
      await handlers.m({ url: "http://_/m", method: "GET" });
      expect(order).toEqual(["global-before", "handler", "global-after"]);
    });

    it("should run route handler when route has handler", async () => {
      const order: string[] = [];
      const api = createApiFactory()
        .route("/m", "m")
        .get({ response: z.object({}) }, () => {
          order.push("handler");
          return {};
        });
      const handlers = api.handlers();
      await handlers.m({ url: "http://_/m", method: "GET" });
      expect(order).toEqual(["handler"]);
    });

    it("should call onError when handler throws", async () => {
      let caught: unknown;
      const api = createApiFactory({
        middleware: {
          onError: (err) => {
            caught = err;
          },
        },
      })
        .route("/err", "err")
        .get({ response: z.object({}) }, () => {
          throw new Error(HANDLER_ERROR);
        });
      const handlers = api.handlers();
      await expect(handlers.err({ url: "http://_/err", method: "GET" })).rejects.toThrow(
        HANDLER_ERROR
      );
      expect(caught).toBeDefined();
      expect((caught as Error).message).toBe(HANDLER_ERROR);
    });

    it("should validate body with Zod and pass to handler", async () => {
      const api = createApiFactory()
        .route("/users", "createUser")
        .post(
          {
            body: z.object({ name: z.string() }),
            response: z.object({ id: z.string() }),
          },
          (ctx) => ({ id: "1", name: (ctx.body as { name: string }).name })
        );
      const handlers = api.handlers();
      const result = await handlers.createUser({
        url: "http://_/users",
        method: "POST",
        body: { name: "Alice" },
      });
      expect(result).toEqual({ id: "1", name: "Alice" });
    });

    it("should throw when body fails validation", async () => {
      const api = createApiFactory()
        .route("/users", "createUser")
        .post(
          {
            body: z.object({ name: z.string() }),
            response: z.object({}),
          },
          () => ({})
        );
      const handlers = api.handlers();
      await expect(
        handlers.createUser({
          url: "http://_/users",
          method: "POST",
          body: { name: 123 },
        })
      ).rejects.toThrow();
    });

    it("should run route-level before/after middleware", async () => {
      const order: string[] = [];
      const api = createApiFactory()
        .route("/r", "r")
        .withMiddleware({
          before: (ctx) => {
            order.push("route-before");
            return ctx;
          },
          after: (_ctx, result) => {
            order.push("route-after");
            return result;
          },
        })
        .get({ response: z.object({}) }, () => {
          order.push("handler");
          return {};
        });
      const handlers = api.handlers();
      await handlers.r({ url: "http://_/r", method: "GET" });
      expect(order).toEqual(["route-before", "handler", "route-after"]);
    });
  });
});
