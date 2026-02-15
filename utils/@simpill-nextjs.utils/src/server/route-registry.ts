import type { IRouteDefinition, IRouteRegistry } from "../shared/interfaces";

/** In-memory route registry implementing IRouteRegistry. */
export function createRouteRegistry(): IRouteRegistry {
  const routes: IRouteDefinition[] = [];

  return {
    define(route: IRouteDefinition): void {
      routes.push(route);
    },
    get(path: string, method: string): IRouteDefinition | undefined {
      const upper = method.toUpperCase();
      return routes.find((r) => r.path === path && r.method.toUpperCase() === upper);
    },
    list(): IRouteDefinition[] {
      return [...routes];
    },
  };
}
