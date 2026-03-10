/**
 * Shared types for Next.js server actions and route handlers.
 */

/** Result shape for safe server actions: data on success, error on failure. */
export interface ActionResult<T, E = ActionError> {
  data?: T;
  error?: E;
}

/** Error shape returned to client from server actions. */
export interface ActionError {
  message: string;
  code?: string;
  validation?: Record<string, string>;
}
