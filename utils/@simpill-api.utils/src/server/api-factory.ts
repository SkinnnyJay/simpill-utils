import { HTTP_METHOD, type HttpMethod } from "@simpill/protocols.utils";
import { ApiDuplicateRouteError } from "../shared/errors";
import type { ApiSchemaLike } from "../shared/infer";
import type { ApiHandler, ApiSchema } from "../shared/types";
import type {
  AnyApiClient,
  AnyApiHandlers,
  ApiFactory,
  ClientBuildOptions,
  CreateApiFactoryOptions,
  RouteEntry,
  RouteMiddleware,
} from "./api-factory-types";
import { buildClient } from "./client-builder";
import { buildHandlers } from "./handler-builder";

export type {
  AnyApiClient,
  AnyApiFactory,
  AnyApiHandlers,
  ApiFactory,
  ClientBuildOptions,
  CreateApiFactoryOptions,
  OnErrorLog,
  OnRequestLog,
  OnResponseLog,
} from "./api-factory-types";

function pathKey(method: HttpMethod, path: string): string {
  return `${method}:${path}`;
}

/**
 * The route builder as it exists at RUNTIME. The public RouteBuilder<> type
 * carries the generics that accumulate the route map; this describes the same
 * object with those generics erased, which is all the implementation needs.
 * Previously both this and its local were `any`, which switched off checking
 * inside the builder itself - the arity and return type of every method went
 * unverified - to work around a mismatch that only exists at the boundary.
 * That boundary is now a single cast in route(), and the body is checked.
 */
interface RuntimeRouteBuilder {
  withMiddleware(m: RouteMiddleware): RuntimeRouteBuilder;
  get(def: ApiSchemaLike, handler?: ApiHandler): unknown;
  post(def: ApiSchemaLike, handler?: ApiHandler): unknown;
  put(def: ApiSchemaLike, handler?: ApiHandler): unknown;
  patch(def: ApiSchemaLike, handler?: ApiHandler): unknown;
  delete(def: ApiSchemaLike, handler?: ApiHandler): unknown;
}

// biome-ignore lint/complexity/noBannedTypes: {} is the empty route map a fresh factory starts from
export function createApiFactory(options: CreateApiFactoryOptions = {}): ApiFactory<{}> {
  const routes: RouteEntry[] = [];
  const routeKeys = new Set<string>();
  const defaultHeaders = options.defaultHeaders ?? {};
  const defaultBaseUrl = options.baseUrl ?? "";
  const globalMiddleware: RouteMiddleware = options.middleware ?? {};
  const logging = options.logging ?? {};

  function addRoute(
    path: string,
    method: HttpMethod,
    def: ApiSchemaLike,
    name?: string,
    handler?: ApiHandler,
    middleware?: RouteEntry["middleware"]
    // biome-ignore lint/complexity/noBannedTypes: runtime accumulator; typing lives in the interfaces
  ): ApiFactory<{}> {
    const key = name ?? pathKey(method, path);
    if (routeKeys.has(key)) {
      // v1 silently let the later route overwrite the earlier one in both
      // client() and handlers() — a silent-data-loss footgun.
      throw new ApiDuplicateRouteError(key);
    }
    routeKeys.add(key);
    const { transform, ...schema } = def;
    routes.push({
      key,
      method,
      path,
      schema: schema as ApiSchema,
      transform: transform as RouteEntry["transform"],
      handler,
      middleware,
    });
    return factory;
  }

  function createRouteBuilder(path: string, name?: string): RuntimeRouteBuilder {
    let routeMiddleware: RouteEntry["middleware"];
    const add =
      (method: HttpMethod) =>
      (def: ApiSchemaLike, handler?: ApiHandler): unknown =>
        addRoute(path, method, def, name, handler, routeMiddleware);
    const builder: RuntimeRouteBuilder = {
      withMiddleware(m: RouteMiddleware) {
        routeMiddleware = m;
        return builder;
      },
      get: add(HTTP_METHOD.GET),
      post: add(HTTP_METHOD.POST),
      put: add(HTTP_METHOD.PUT),
      patch: add(HTTP_METHOD.PATCH),
      delete: add(HTTP_METHOD.DELETE),
    };
    return builder;
  }

  // biome-ignore lint/complexity/noBannedTypes: fresh factory has an empty route map
  const factory: ApiFactory<{}> = {
    route(path: string, name?: string) {
      // Single boundary cast: runtime shape -> the generic public RouteBuilder.
      // biome-ignore lint/complexity/noBannedTypes: {} is the empty route map a fresh factory starts from
      return createRouteBuilder(path, name) as unknown as ReturnType<ApiFactory<{}>["route"]>;
    },

    client(opts: ClientBuildOptions = {}) {
      return buildClient(routes, defaultBaseUrl, defaultHeaders, logging, opts) as AnyApiClient;
    },

    handlers() {
      return buildHandlers(routes, globalMiddleware, logging) as AnyApiHandlers;
    },
  };

  return factory;
}
