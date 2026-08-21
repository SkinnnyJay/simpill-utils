import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { ERROR_UNKNOWN_ERROR, ERROR_UNWRAP_ERR, ERROR_UNWRAP_ERR_OK } from "./constants";

/**
 * Result type: Ok(T) | Err(E). Use for success/failure flow without throwing.
 *
 * This module provides the full combinator surface expected of a modern
 * Result implementation (neverthrow / Rust std parity) as tree-shakeable
 * standalone functions over the same plain-object shape — no classes, no
 * prototype chains, and full backward compatibility with the original
 * { ok, value } / { ok, error } literals.
 *
 * Transform:   map, mapErr, andThen, orElse, tap, tapErr
 * Consume:     match (exhaustive), unwrap, unwrapErr, unwrapOr, unwrapOrElse
 * Aggregate:   combine (first-error short-circuit), combineWithAllErrors
 * Async:       mapAsync, andThenAsync, toResult, fromPromise
 * Interop:     fromThrowable, fromNullable, safeTry + safeUnwrap (Rust `?`)
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/** Success result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Failure result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Type guard: true if result is Ok. */
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok === true;
}

/** Type guard: true if result is Err. */
export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return r.ok === false;
}

/** Value if Ok, else fallback. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/** Value if Ok, else fallback computed from the error (lazy). */
export function unwrapOrElse<T, E>(r: Result<T, E>, fallback: (error: E) => T): T {
  return r.ok ? r.value : fallback(r.error);
}

/** Value if Ok; throws if Err (Error instances rethrown, others wrapped with cause). */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  if (r.error instanceof Error) throw r.error;
  const wrapped = new Error(ERROR_UNWRAP_ERR);
  (wrapped as Error & { cause: unknown }).cause = r.error;
  throw wrapped;
}

/** Error if Err; throws if Ok. */
export function unwrapErr<T, E>(r: Result<T, E>): E {
  if (!r.ok) return r.error;
  throw new Error(ERROR_UNWRAP_ERR_OK);
}

/** Transform the Ok value; Err passes through untouched. */
export function map<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** Transform the Err value; Ok passes through untouched. */
export function mapErr<T, E, F>(r: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return r.ok ? r : err(fn(r.error));
}

/** Chain a Result-returning fn on Ok (flatMap); Err short-circuits. */
export function andThen<T, U, E, F>(
  r: Result<T, E>,
  fn: (value: T) => Result<U, F>
): Result<U, E | F> {
  return r.ok ? fn(r.value) : r;
}

/** Recover from Err with a Result-returning fn; Ok passes through. */
export function orElse<T, U, E, F>(
  r: Result<T, E>,
  fn: (error: E) => Result<U, F>
): Result<T | U, F> {
  return r.ok ? r : fn(r.error);
}

/** Run a side effect on Ok; result passes through unchanged. */
export function tap<T, E>(r: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (r.ok) fn(r.value);
  return r;
}

/** Run a side effect on Err; result passes through unchanged. */
export function tapErr<T, E>(r: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (!r.ok) fn(r.error);
  return r;
}

/** Exhaustive fold: exactly one of onOk/onErr runs; both branches must be handled. */
export function match<T, E, U>(r: Result<T, E>, onOk: (value: T) => U, onErr: (error: E) => U): U {
  return r.ok ? onOk(r.value) : onErr(r.error);
}

/** All Ok -> Ok(values[]); first Err short-circuits. */
export function combine<T, E>(results: ReadonlyArray<Result<T, E>>): Result<T[], E> {
  const values: T[] = new Array(results.length);
  for (let i = 0; i < results.length; i++) {
    const r = results[i] as Result<T, E>;
    if (!r.ok) return r;
    values[i] = r.value;
  }
  return ok(values);
}

/** All Ok -> Ok(values[]); otherwise Err with EVERY error collected. */
export function combineWithAllErrors<T, E>(results: ReadonlyArray<Result<T, E>>): Result<T[], E[]> {
  const values: T[] = [];
  const errors: E[] = [];
  for (const r of results) {
    if (r.ok) values.push(r.value);
    else errors.push(r.error);
  }
  return errors.length > 0 ? err(errors) : ok(values);
}

/** ok(value) unless value is null/undefined, then err(onNullish()). */
export function fromNullable<T, E>(value: T | null | undefined, onNullish: () => E): Result<T, E> {
  return value == null ? err(onNullish()) : ok(value as T);
}

/** Run sync fn; return Ok(value) or Err(caught / mapError(caught)). */
export function fromThrowable<T>(fn: () => T): Result<T, unknown>;
export function fromThrowable<T, E>(fn: () => T, mapError: (error: unknown) => E): Result<T, E>;
export function fromThrowable<T, E>(
  fn: () => T,
  mapError?: (error: unknown) => E
): Result<T, E | unknown> {
  try {
    return ok(fn());
  } catch (e) {
    return err(mapError ? mapError(e) : e);
  }
}

/** Async map: transform Ok with an async fn; Err passes through. */
export async function mapAsync<T, U, E>(
  r: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> {
  return r.ok ? ok(await fn(r.value)) : r;
}

/** Async chain: Ok feeds an async Result-returning fn; Err short-circuits.
 *  Accepts and returns Promise<Result> so chains read linearly:
 *  `await andThenAsync(andThenAsync(start, stepA), stepB)`. */
export async function andThenAsync<T, U, E, F>(
  r: Result<T, E> | Promise<Result<T, E>>,
  fn: (value: T) => Result<U, F> | Promise<Result<U, F>>
): Promise<Result<U, E | F>> {
  const resolved = await r;
  return resolved.ok ? fn(resolved.value) : resolved;
}

const SAFE_UNWRAP_ERR: unique symbol = Symbol("safeTry.err");

interface SafeUnwrapSignal<E> {
  readonly brand: typeof SAFE_UNWRAP_ERR;
  readonly error: E;
}

/** Use inside safeTry with `yield*` to emulate Rust's `?` operator:
 *  Ok unwraps to its value; Err aborts the safeTry block with that error. */
export function* safeUnwrap<T, E>(r: Result<T, E>): Generator<SafeUnwrapSignal<E>, T> {
  if (r.ok) return r.value;
  yield { brand: SAFE_UNWRAP_ERR, error: r.error };
  // The safeTry driver never resumes after a yielded Err.
  throw new Error(ERROR_UNKNOWN_ERROR);
}

/** Rust-style `?` block. First `yield* safeUnwrap(errResult)` short-circuits:
 *  ```ts
 *  const r = safeTry(function* () {
 *    const a = yield* safeUnwrap(parse(x));   // T, or early Err return
 *    const b = yield* safeUnwrap(validate(a));
 *    return ok(a + b);
 *  });
 *  ``` */
export function safeTry<T, E>(
  body: () => Generator<SafeUnwrapSignal<E>, Result<T, E>>
): Result<T, E> {
  const gen = body();
  const step = gen.next();
  if (step.done) return step.value;
  return err(step.value.error);
}

/** Async safeTry: same protocol over an async generator; awaits are allowed in the body. */
export async function safeTryAsync<T, E>(
  body: () => AsyncGenerator<SafeUnwrapSignal<E>, Result<T, E>>
): Promise<Result<T, E>> {
  const gen = body();
  const step = await gen.next();
  if (step.done) return step.value;
  return err(step.value.error);
}

const defaultMapError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, { code: ERROR_CODES.INTERNAL, cause: error });
  }
  return new AppError(ERROR_UNKNOWN_ERROR, { code: ERROR_CODES.INTERNAL, cause: error });
};

/** Await promise; return Ok(value) or Err(mapError(e)). Default mapError yields AppError. */
export async function toResult<T>(
  promise: Promise<T>,
  mapError: (error: unknown) => AppError = defaultMapError
): Promise<Result<T, AppError>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}

/** Run async fn(); same as toResult(fn(), mapError). */
export async function fromPromise<T>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => AppError = defaultMapError
): Promise<Result<T, AppError>> {
  return toResult(fn(), mapError);
}
