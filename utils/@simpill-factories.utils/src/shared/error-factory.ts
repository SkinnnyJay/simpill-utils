/** Creates a function that returns a new Error (or subclass) with fixed message/code for consistent error creation. */
export type ErrorConstructor = new (message: string) => Error;

/** Per-call options for a factory-produced error. */
export interface ErrorFactoryOptions {
  /** Attached as `error.cause` (ES2022 convention) for error chaining. */
  cause?: unknown;
}

/** Factory-level options for errorFactory. */
export interface ErrorFactorySettings {
  /**
   * Re-capture the stack so the factory's wrapper frame is excluded (default
   * true). Set false to skip the re-capture on hot paths where errors are
   * created in bulk without being thrown — creation is ~2x faster without it.
   */
  cleanStack?: boolean;
}

type WithCode<E extends Error> = E & { code?: string };

// Feature-detected: V8/Node always; other engines increasingly ship it too.
const captureStackTrace: ((target: object, ctor?: unknown) => void) | undefined =
  // biome-ignore lint/suspicious/noExplicitAny: feature detection on the Error constructor
  typeof (Error as any).captureStackTrace === "function"
    ? // biome-ignore lint/suspicious/noExplicitAny: feature detection on the Error constructor
      (Error as any).captureStackTrace.bind(Error)
    : undefined;

/**
 * Returns a creator `(message?, code?, options?) => E` bound to a default
 * message/code. The concrete subclass type E is preserved (fields on custom
 * error classes stay visible), `code` is typed on the result, `options.cause`
 * chains an underlying error, and the creator's own wrapper frame is removed
 * from `error.stack` where Error.captureStackTrace is available — stacks point
 * at YOUR call site, not at error-factory internals.
 */
export function errorFactory<E extends Error>(
  Ctor: new (message: string) => E,
  defaultMessage: string,
  defaultCode?: string,
  settings?: ErrorFactorySettings
): (message?: string, code?: string, options?: ErrorFactoryOptions) => WithCode<E> {
  const cleanStack = settings?.cleanStack !== false;
  const create = (message?: string, code?: string, options?: ErrorFactoryOptions): WithCode<E> => {
    const err = new Ctor(message ?? defaultMessage) as WithCode<E>;
    if (defaultCode != null || code != null) {
      err.code = code ?? defaultCode;
    }
    if (options !== undefined && "cause" in options) {
      (err as WithCode<E> & { cause?: unknown }).cause = options.cause;
    }
    if (cleanStack && captureStackTrace !== undefined) {
      captureStackTrace(err, create);
    }
    return err;
  };
  return create;
}
