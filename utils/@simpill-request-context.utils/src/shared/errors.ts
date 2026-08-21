/**
 * Thrown by requireRequestContext() when called outside of an active
 * runWithRequestContext / store.run scope (including from the client entry,
 * which never has an active context).
 */
export class RequestContextUnavailableError extends Error {
  constructor(message = "No active request context: call inside runWithRequestContext()") {
    super(message);
    this.name = "RequestContextUnavailableError";
    Error.captureStackTrace?.(this, RequestContextUnavailableError);
  }
}
