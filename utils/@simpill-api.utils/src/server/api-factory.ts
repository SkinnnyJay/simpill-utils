import { HTTP_METHOD, type HttpMethod } from "@simpill/protocols.utils";
import type { ApiHandler, ApiSchema } from "../shared/types";
import type {
  ApiFactory,
  CreateApiFactoryOptions,
  RouteBuilder,
  RouteEntry,
  RouteMiddleware,
} from "./api-factory-types";
import { buildClient } from "./client-builder";
import { buildHandlers } from "./handler-builder";

export type {
  ApiFactory,
  CreateApiFactoryOptions,
  OnErrorLog,
  OnRequestLog,
  OnResponseLog,
} from "./api-factory-types";

function pathKey(method: HttpMethod, path: string): string {
  return `${method}:${path}`;
}

export function createApiFactory(options: CreateApiFactoryOptions = {}): ApiFactory {
  const routes: RouteEntry[] = [];
  const defaultHeaders = options.defaultHeaders ?? {};
  const defaultBaseUrl = options.baseUrl ?? "";
  const globalMiddleware: RouteMiddleware = options.middleware ?? {};
  const logging = options.logging ?? {};

  function addRoute(
    path: string,
    method: HttpMethod,
    schema: ApiSchema,
    name?: string,
    handler?: ApiHandler,
    middleware?: RouteEntry["middleware"]
  ): ApiFactory {
    const key = name ?? pathKey(method, path);
    routes.push({
      key,
      method,
      path,
      schema,
      handler,
      middleware,
    });
    return factory;
  }

  function createRouteBuilder(path: string, name?: string): RouteBuilder {
    let routeMiddleware: RouteEntry["middleware"];
    const add = (method: HttpMethod) => (schema: ApiSchema, handler?: ApiHandler) =>
      addRoute(path, method, schema, name, handler, routeMiddleware);
    const builder: RouteBuilder = {
      withMiddleware(m) {
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

  const factory: ApiFactory = {
    route(path: string, name?: string) {
      return createRouteBuilder(path, name);
    },

    client(opts = {}) {
      return buildClient(routes, defaultBaseUrl, defaultHeaders, logging, opts);
    },

    handlers() {
      return buildHandlers(routes, globalMiddleware, logging);
    },
  };

  return factory;
}
