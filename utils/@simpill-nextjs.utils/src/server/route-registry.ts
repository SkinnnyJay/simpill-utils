import type { IRouteDefinition, IRouteMatch, IRouteRegistry } from "../shared/interfaces";

/** Thrown when a duplicate (method, path) route is defined with onDuplicate: "throw". */
export class DuplicateRouteError extends Error {
  readonly path: string;
  readonly method: string;

  constructor(path: string, method: string) {
    super(`Route already defined: ${method.toUpperCase()} ${path}`);
    this.name = "DuplicateRouteError";
    this.path = path;
    this.method = method;
  }
}

export interface CreateRouteRegistryOptions {
  /**
   * Behavior when the same (method, path) is defined twice:
   * - "ignore" (default, pre-uplift semantics): both appear in list(),
   *   get() keeps returning the FIRST definition
   * - "throw": throw DuplicateRouteError instead of silently shadowing
   */
  onDuplicate?: "ignore" | "throw";
}

const PARAM_PREFIX = ":";

function routeKey(path: string, method: string): string {
  return `${method.toUpperCase()} ${path}`;
}

function matchParamRoute(
  routePath: string,
  requestPath: string
): Record<string, string> | undefined {
  const routeSegments = routePath.split("/");
  const requestSegments = requestPath.split("/");
  if (routeSegments.length !== requestSegments.length) {
    return undefined;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    if (routeSegment.startsWith(PARAM_PREFIX) && routeSegment.length > 1) {
      try {
        params[routeSegment.slice(1)] = decodeURIComponent(requestSegments[i]);
      } catch {
        params[routeSegment.slice(1)] = requestSegments[i];
      }
    } else if (routeSegment !== requestSegments[i]) {
      return undefined;
    }
  }
  return params;
}

/**
 * In-memory route registry implementing IRouteRegistry.
 * get() is O(1) via a Map index (was an O(n) Array#find scan per lookup);
 * first-wins duplicate semantics and list() contents are unchanged.
 * match() additionally resolves `:param` path patterns (static routes win),
 * returning the route plus decoded params.
 */
export function createRouteRegistry(options: CreateRouteRegistryOptions = {}): IRouteRegistry {
  const routes: IRouteDefinition[] = [];
  const byKey = new Map<string, IRouteDefinition>();
  const paramRoutes: IRouteDefinition[] = [];

  return {
    define(route: IRouteDefinition): void {
      const key = routeKey(route.path, route.method);
      if (byKey.has(key)) {
        if (options.onDuplicate === "throw") {
          throw new DuplicateRouteError(route.path, route.method);
        }
      } else {
        byKey.set(key, route);
        if (route.path.includes(`/${PARAM_PREFIX}`)) {
          paramRoutes.push(route);
        }
      }
      routes.push(route);
    },
    get(path: string, method: string): IRouteDefinition | undefined {
      return byKey.get(routeKey(path, method));
    },
    list(): IRouteDefinition[] {
      return [...routes];
    },
    match(path: string, method: string): IRouteMatch | undefined {
      const exact = byKey.get(routeKey(path, method));
      if (exact !== undefined) {
        return { route: exact, params: {} };
      }
      const upper = method.toUpperCase();
      for (const route of paramRoutes) {
        if (route.method.toUpperCase() !== upper) {
          continue;
        }
        const params = matchParamRoute(route.path, path);
        if (params !== undefined) {
          return { route, params };
        }
      }
      return undefined;
    },
  };
}
