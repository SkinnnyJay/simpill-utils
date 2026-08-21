import type { HttpMethod } from "@simpill/protocols.utils";
import type { z } from "zod";

/**
 * Type-level machinery for end-to-end inference: route definitions accumulate
 * into a typed route map, so api.client() and api.handlers() return fully
 * typed methods derived from the Zod schemas. Zero runtime cost — this file
 * is types only (plus nothing).
 */

/** Structural shape of a route definition object (schema + optional transform). */
export interface ApiSchemaLike {
  params?: z.ZodType<unknown>;
  query?: z.ZodType<unknown>;
  body?: z.ZodType<unknown>;
  response?: z.ZodType<unknown>;
  /**
   * Optional response transform, applied by the client after schema parsing.
   * Declared on ApiRouteDef since v1 but never wired up; now settable here.
   *
   * The parameter is `never`, not `any`. Both accept a transform whose input is
   * typed however the caller likes - under strictFunctionTypes parameters are
   * checked contravariantly, and `never` is the bottom type, so every parameter
   * type is a supertype of it. Unlike `any` it does not switch off checking of
   * the value flowing through.
   */
  transform?: (data: never) => unknown;
}

/** z.input of a schema slot, or the fallback when the slot is absent. */
export type InferInput<S, TFallback> = S extends z.ZodType<unknown> ? z.input<S> : TFallback;

/** z.output of a schema slot, or the fallback when the slot is absent. */
export type InferOutput<S, TFallback> = S extends z.ZodType<unknown> ? z.output<S> : TFallback;

/** What a client method resolves to: transform return type, else response schema output. */
export type ClientResult<S extends ApiSchemaLike> = S["transform"] extends (data: never) => infer U
  ? U
  : InferOutput<S["response"], unknown>;

/** One accumulated route entry at the type level. */
export interface RouteTypeShape {
  schema: ApiSchemaLike;
  hasHandler: boolean;
}

/** Accumulated route map (key -> shape). */
export type ApiRoutesShape = Record<string, RouteTypeShape>;

/** Default route key when no name is given: "METHOD:path". */
export type RouteKey<M extends HttpMethod, P extends string, N> = N extends string
  ? N
  : `${M}:${P}`;

/**
 * Handler return type. The union with an indexed intersection deliberately
 * relaxes excess-property checking so handlers may return supersets of the
 * response schema (v1 handlers commonly did; middleware/clients strip or
 * validate downstream).
 */
export type HandlerReturn<R> = R | (R & { [key: string]: unknown });

/** Typed request context derived from a schema. */
export interface TypedRequestContext<S extends ApiSchemaLike> {
  params: InferOutput<S["params"], Record<string, string>>;
  query: InferOutput<S["query"], Record<string, unknown>>;
  body: InferOutput<S["body"], unknown>;
  headers: Record<string, string>;
  method: HttpMethod;
  url: string;
}

/** Typed handler signature derived from a schema. */
export type TypedHandler<S extends ApiSchemaLike> = (
  ctx: TypedRequestContext<S>
) =>
  | HandlerReturn<InferOutput<S["response"], unknown>>
  | Promise<HandlerReturn<InferOutput<S["response"], unknown>>>;

/**
 * One options slot: required when the schema's input type itself has required
 * members; optional when the schema accepts {} (or no schema was given).
 */
type Slot<K extends string, S, TLoose> =
  S extends z.ZodType<unknown>
    ? // biome-ignore lint/complexity/noBannedTypes: `{} extends T` is the canonical "all members optional" test
      {} extends z.input<S>
      ? { [P in K]?: z.input<S> }
      : { [P in K]: z.input<S> }
    : { [P in K]?: TLoose };

/** Per-call options for a typed client method. */
export type ClientCallOptionsFor<S extends ApiSchemaLike> = Slot<
  "params",
  S["params"],
  Record<string, string>
> &
  Slot<
    "query",
    S["query"],
    Record<string, string | number | boolean | Array<string | number | boolean>>
  > &
  Slot<"body", S["body"], unknown> & {
    headers?: Record<string, string>;
  };

/** A typed client method; the options argument is optional when nothing is required. */
export type TypedClientMethod<R extends RouteTypeShape> =
  // biome-ignore lint/complexity/noBannedTypes: `{} extends O` is the canonical "all members optional" test
  {} extends ClientCallOptionsFor<R["schema"]>
    ? (options?: ClientCallOptionsFor<R["schema"]>) => Promise<ClientResult<R["schema"]>>
    : (options: ClientCallOptionsFor<R["schema"]>) => Promise<ClientResult<R["schema"]>>;

/** Fully typed client derived from the accumulated route map. */
export type TypedClient<TRoutes extends ApiRoutesShape> = {
  [K in keyof TRoutes]: TypedClientMethod<TRoutes[K]>;
};

/** Raw handler request (wire input stays untrusted/unknown by design). */
export interface HandlerRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/** Fully typed handler registry: only routes registered WITH a handler appear. */
export type TypedHandlers<TRoutes extends ApiRoutesShape> = {
  [K in keyof TRoutes as TRoutes[K]["hasHandler"] extends true ? K : never]: (
    req: HandlerRequest
  ) => Promise<InferOutput<TRoutes[K]["schema"]["response"], unknown>>;
};
