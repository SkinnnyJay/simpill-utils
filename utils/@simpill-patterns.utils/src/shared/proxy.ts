/** Hooks for intercepting method calls: before, after, error. */
export type MethodProxyHooks<T extends Record<string, (...args: unknown[]) => unknown>> = {
  before?: (method: keyof T, args: unknown[]) => void;
  after?: (method: keyof T, args: unknown[], result: unknown) => void;
  error?: (method: keyof T, args: unknown[], error: unknown) => void;
};

/** Intercept method calls with optional before/after/error hooks. */
export function createMethodProxy<T extends Record<string, (...args: unknown[]) => unknown>>(
  target: T,
  hooks: MethodProxyHooks<T>
): T {
  return new Proxy(target, {
    get: (obj, prop, receiver) => {
      const value = Reflect.get(obj, prop, receiver);
      if (typeof prop !== "string" || typeof value !== "function") {
        return value;
      }
      return (...args: unknown[]) => {
        hooks.before?.(prop as keyof T, args);
        try {
          const result = (value as (...innerArgs: unknown[]) => unknown)(...args);
          hooks.after?.(prop as keyof T, args, result);
          return result;
        } catch (error) {
          hooks.error?.(prop as keyof T, args, error);
          throw error;
        }
      };
    },
  });
}
