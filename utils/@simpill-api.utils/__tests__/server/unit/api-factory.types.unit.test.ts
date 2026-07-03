/**
 * @file Type Inference Tests
 * @description Compile-time proof of end-to-end inference. ts-jest runs with
 * type diagnostics enabled, so any type error here fails the suite, and every
 * @ts-expect-error line asserts that the marked misuse no longer compiles.
 * v1 typed everything as Promise<unknown> and told users to cast at the call
 * site (README: "assert after the call").
 */

import { z } from "zod";
import { createApiFactory } from "../../../src/server/api-factory";

/** Compile-time equality assertion. */
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const userSchema = z.object({ id: z.string(), name: z.string() });

describe("type inference", () => {
  it("infers client return types from response schemas (no casts)", async () => {
    const api = createApiFactory()
      .route("/users/:id", "getUser")
      .get({
        params: z.object({ id: z.string() }),
        response: userSchema,
      });
    const client = api.client({
      fetcher: async () =>
        new Response(JSON.stringify({ id: "1", name: "Alice" }), { status: 200 }),
    });
    const user = await client.getUser({ params: { id: "1" } });
    // user is { id: string; name: string } — no cast, no unknown.
    type _T1 = Expect<Equal<typeof user, { id: string; name: string }>>;
    expect(user.name).toBe("Alice");
  });

  it("requires params when the params schema has required members", async () => {
    const api = createApiFactory()
      .route("/users/:id", "getUser")
      .get({ params: z.object({ id: z.string() }), response: userSchema });
    const client = api.client({
      fetcher: async () => new Response(JSON.stringify({ id: "1", name: "A" }), { status: 200 }),
    });
    // @ts-expect-error — params.id is required by the schema
    const p = client.getUser();
    await p.catch(() => {}); // runtime: missing param throws; swallow
    await client.getUser({ params: { id: "1" } });
  });

  it("rejects wrongly-typed params/body at compile time", async () => {
    const api = createApiFactory()
      .route("/users", "createUser")
      .post({ body: z.object({ name: z.string() }), response: userSchema });
    const client = api.client({
      fetcher: async () => new Response(JSON.stringify({ id: "1", name: "A" }), { status: 200 }),
    });
    // @ts-expect-error — body.name must be a string
    await client.createUser({ body: { name: 123 } }).catch(() => {});
    await client.createUser({ body: { name: "Jane" } });
  });

  it("uses default METHOD:path keys as literal types", async () => {
    const api = createApiFactory()
      .route("/me")
      .get({ response: z.object({ ok: z.boolean() }) });
    const client = api.client({
      fetcher: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    });
    const res = await client["GET:/me"]();
    type _T2 = Expect<Equal<typeof res, { ok: boolean }>>;
    // @ts-expect-error — no such route key
    client["GET:/nope"];
    expect(res.ok).toBe(true);
  });

  it("types handler ctx from schemas and handlers() results from response schemas", async () => {
    const api = createApiFactory()
      .route("/users/:id", "getUser")
      .get(
        {
          params: z.object({ id: z.string() }),
          query: z.object({ verbose: z.string().optional() }),
          response: userSchema,
        },
        (ctx) => {
          // ctx.params is { id: string } — no casts needed (v1: unknown).
          type _P = Expect<Equal<typeof ctx.params, { id: string }>>;
          return { id: ctx.params.id, name: "x" };
        }
      );
    const handlers = api.handlers();
    const result = await handlers.getUser({ url: "http://_/users/abc", method: "GET" });
    type _R = Expect<Equal<typeof result, { id: string; name: string }>>;
    expect(result.id).toBe("abc");
  });

  it("excludes handler-less routes from handlers() at the type level", () => {
    const api = createApiFactory()
      .route("/a", "withHandler")
      .get({ response: z.object({}) }, () => ({}))
      .route("/b", "noHandler")
      .get({ response: z.object({}) });
    const handlers = api.handlers();
    expect(typeof handlers.withHandler).toBe("function");
    // @ts-expect-error — noHandler was defined without a handler
    handlers.noHandler;
  });

  it("types transform results", async () => {
    const api = createApiFactory()
      .route("/user", "user")
      .get({
        response: userSchema,
        transform: (data: z.infer<typeof userSchema>) => data.name.length,
      });
    const client = api.client({
      fetcher: async () =>
        new Response(JSON.stringify({ id: "1", name: "Alice" }), { status: 200 }),
    });
    const len = await client.user();
    type _T3 = Expect<Equal<typeof len, number>>;
    expect(len).toBe(5);
  });

  it("keeps zero-schema routes loose (v1-style unknown)", async () => {
    const api = createApiFactory().route("/raw", "raw").get({});
    const client = api.client({
      fetcher: async () => new Response("{}", { status: 200 }),
    });
    const result = await client.raw();
    type _T4 = Expect<Equal<typeof result, unknown>>;
    expect(result).toEqual({});
  });
});
